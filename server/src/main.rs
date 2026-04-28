use actix_cors::Cors;
use actix_multipart::Multipart;
use actix_web::{delete, get, post, web, App, HttpResponse, HttpServer, Responder};
use dotenv::dotenv;
use futures_util::StreamExt as _;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::env;
use std::sync::{Arc, Mutex};

// ─── STRUCTS ───
#[derive(Deserialize, Serialize, Clone)]
struct Song {
    #[serde(default)]
    id: Option<serde_json::Value>,
    #[serde(default)]
    name: String,
    #[serde(default)]
    artist: String,
    #[serde(default)]
    genre: String,
    #[serde(default)]
    song_url: String,
    #[serde(default)]
    image_url: String,
    #[serde(default)]
    album: String,
}
#[derive(Deserialize, Serialize, Clone)]
struct Playlist {
    #[serde(default)]
    id: Option<serde_json::Value>,
    name: String,
    song_ids: Option<Vec<String>>,
}
fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '.' || c == '-' || c == '_' {
                c
            } else {
                '_'
            }
        })
        .collect()
}
#[derive(Deserialize, Serialize, Clone)]
struct NewPlaylist {
    name: String,
    song_ids: Option<Vec<String>>,
}
#[derive(Deserialize)]
struct SongQuery {
    nombre: Option<String>,
    artista: Option<String>,
    genero: Option<String>,
    orden: Option<String>,
}
type PlayingNow = Arc<Mutex<HashSet<String>>>;

// ─── CANCIONES ───
#[get("/songs")]
async fn get_songs(client: web::Data<Client>, query: web::Query<SongQuery>) -> impl Responder {
    let base_url = env::var("SUPABASE_URL").expect("SUPABASE_URL no definida");
    let api_key = env::var("SECRET_API_KEY").expect("SECRET_API_KEY no definida");

    let mut url = format!("{}/rest/v1/songs?select=*", base_url);

    if let Some(nombre) = &query.nombre {
        url.push_str(&format!("&name=ilike.*{}*", nombre));
    }
    if let Some(artista) = &query.artista {
        url.push_str(&format!("&artist=ilike.*{}*", artista));
    }
    if let Some(genero) = &query.genero {
        url.push_str(&format!("&genre=eq.{}", genero));
    }

    match client
        .get(&url)
        .header("apikey", &api_key)
        .header("Authorization", format!("Bearer {}", &api_key))
        .send()
        .await
    {
        Ok(res) => match res.json::<Vec<Song>>().await {
            Ok(songs) => HttpResponse::Ok().json(songs),
            Err(e) => {
                eprintln!("Error al parsear: {}", e);
                HttpResponse::InternalServerError().body("Error al parsear respuesta")
            }
        },
        Err(_) => HttpResponse::InternalServerError().body("Error al conectar con Supabase"),
    }
}

#[post("/admin/songs")]
async fn add_song(client: web::Data<Client>, mut payload: Multipart) -> impl Responder {
    let base_url = env::var("SUPABASE_URL").expect("SUPABASE_URL no definida");
    let api_key = env::var("SECRET_API_KEY").expect("SECRET_API_KEY no definida");

    let mut name = String::new();
    let mut artist = String::new();
    let mut genre = String::new();
    let mut album = String::new();
    let mut song_url = String::new();
    let mut image_url = String::new();

    while let Some(Ok(mut field)) = payload.next().await {
        let field_name = field.name().unwrap_or("").to_string();
        let content_type = field
            .content_type()
            .map(|ct| ct.to_string())
            .unwrap_or_else(|| "application/octet-stream".to_string());
        let filename = field
            .content_disposition()
            .and_then(|cd| cd.get_filename())
            .map(sanitize_filename)
            .unwrap_or_else(|| "file".to_string());

        let mut bytes: Vec<u8> = Vec::new();
        while let Some(Ok(chunk)) = field.next().await {
            bytes.extend_from_slice(&chunk);
        }

        match field_name.as_str() {
            "name" => name = String::from_utf8_lossy(&bytes).trim().to_string(),
            "artist" => artist = String::from_utf8_lossy(&bytes).trim().to_string(),
            "genre" => genre = String::from_utf8_lossy(&bytes).trim().to_string(),
            "album" => album = String::from_utf8_lossy(&bytes).trim().to_string(),

            "song" if !bytes.is_empty() => {
                let ts = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_millis();
                let unique = format!("{}-{}", ts, filename);
                let upload_url =
                    format!("{}/storage/v1/object/spoticry/songs/{}", base_url, unique);

                match client
                    .post(&upload_url)
                    .header("apikey", &api_key)
                    .header("Authorization", format!("Bearer {}", api_key))
                    .header("Content-Type", &content_type)
                    .body(bytes)
                    .send()
                    .await
                {
                    Ok(res) if res.status().is_success() => {
                        song_url = format!(
                            "{}/storage/v1/object/public/spoticry/songs/{}",
                            base_url, unique
                        );
                    }
                    Ok(res) => {
                        let status = res.status();
                        let body = res.text().await.unwrap_or_default();
                        eprintln!("Error subiendo MP3: {} — {}", status, body);
                        return HttpResponse::InternalServerError()
                            .body("Error al subir el archivo de audio");
                    }
                    Err(e) => {
                        eprintln!("Error subiendo MP3: {}", e);
                        return HttpResponse::InternalServerError()
                            .body("Error al subir el archivo de audio");
                    }
                }
            }

            "image" if !bytes.is_empty() => {
                let ts = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_millis();
                let unique = format!("{}-{}", ts, filename);
                let upload_url =
                    format!("{}/storage/v1/object/spoticry/covers/{}", base_url, unique);

                match client
                    .post(&upload_url)
                    .header("apikey", &api_key)
                    .header("Authorization", format!("Bearer {}", api_key))
                    .header("Content-Type", &content_type)
                    .body(bytes)
                    .send()
                    .await
                {
                    Ok(res) if res.status().is_success() => {
                        image_url = format!(
                            "{}/storage/v1/object/public/spoticry/covers/{}",
                            base_url, unique
                        );
                    }
                    Ok(res) => {
                        let status = res.status();
                        let body = res.text().await.unwrap_or_default();
                        eprintln!("Error subiendo imagen: {} — {}", status, body);
                        return HttpResponse::InternalServerError()
                            .body("Error al subir la imagen");
                    }
                    Err(e) => {
                        eprintln!("Error subiendo imagen: {}", e);
                        return HttpResponse::InternalServerError()
                            .body("Error al subir la imagen");
                    }
                }
            }

            _ => {}
        }
    }

    if song_url.is_empty() || image_url.is_empty() {
        return HttpResponse::BadRequest()
            .body("Se requieren ambos archivos: audio (.mp3) e imagen");
    }

    let db_url = format!("{}/rest/v1/songs", base_url);
    let new_song = serde_json::json!({
        "name": name,
        "artist": artist,
        "genre": genre,
        "song_url": song_url,
        "image_url": image_url,
        "album": album,
    });

    match client
        .post(&db_url)
        .header("apikey", &api_key)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .header("Prefer", "return=representation")
        .json(&new_song)
        .send()
        .await
    {
        Ok(res) => {
            if res.status().is_success() {
                match res.json::<Vec<Song>>().await {
                    Ok(mut songs) => match songs.pop() {
                        Some(song) => HttpResponse::Created().json(song),
                        None => HttpResponse::Created().body("Canción agregada"),
                    },
                    Err(_) => HttpResponse::Created().body("Canción agregada"),
                }
            } else {
                HttpResponse::BadRequest().body("Error al guardar la canción en la base de datos")
            }
        }
        Err(e) => {
            eprintln!("Error: {}", e);
            HttpResponse::InternalServerError().body("Error al conectar con Supabase")
        }
    }
}

#[delete("/admin/songs/{id}")]
async fn delete_song(
    path: web::Path<String>,
    playing: web::Data<PlayingNow>,
    client: web::Data<Client>,
) -> impl Responder {
    let song_id = path.into_inner();

    let playing_set = playing.lock().unwrap();
    if playing_set.contains(&song_id) {
        return HttpResponse::Conflict()
            .body("No se puede eliminar: la canción está siendo reproducida");
    }
    drop(playing_set);

    let base_url = env::var("SUPABASE_URL").expect("SUPABASE_URL no definida");
    let api_key = env::var("SECRET_API_KEY").expect("SECRET_API_KEY no definida");

    let url = format!("{}/rest/v1/songs?id=eq.{}", base_url, song_id);

    match client
        .delete(&url)
        .header("apikey", &api_key)
        .header("Authorization", format!("Bearer {}", &api_key))
        .send()
        .await
    {
        Ok(_) => HttpResponse::Ok().body("Canción eliminada permanentemente"),
        Err(e) => {
            eprintln!("Error: {}", e);
            HttpResponse::InternalServerError().body("Error al eliminar")
        }
    }
}

// ─── STREAMING ───
#[post("/stream/start/{id}")]
async fn start_stream(path: web::Path<String>, playing: web::Data<PlayingNow>) -> impl Responder {
    let song_id = path.into_inner();
    let mut playing_set = playing.lock().unwrap();

    if playing_set.contains(&song_id) {
        return HttpResponse::Conflict().body("La canción ya está en reproducción");
    }

    playing_set.insert(song_id.clone());
    println!("▶ Reproduciendo: {}", song_id);

    HttpResponse::Ok().json(serde_json::json!({
        "status": "playing",
        "song_id": song_id
    }))
}

#[post("/stream/stop/{id}")]
async fn stop_stream(path: web::Path<String>, playing: web::Data<PlayingNow>) -> impl Responder {
    let song_id = path.into_inner();
    let mut playing_set = playing.lock().unwrap();
    playing_set.remove(&song_id);
    println!("⏹ Detenido: {}", song_id);

    HttpResponse::Ok().json(serde_json::json!({
        "status": "stopped",
        "song_id": song_id
    }))
}

// ─── PLAYLISTS ───
#[post("/playlist")]
async fn create_playlist(
    client: web::Data<Client>,
    body: web::Json<NewPlaylist>,
) -> impl Responder {
    let base_url = env::var("SUPABASE_URL").expect("SUPABASE_URL no definida");
    let api_key = env::var("SECRET_API_KEY").expect("SECRET_API_KEY no definida");

    let url = format!("{}/rest/v1/playlists", base_url);

    let new_playlist = serde_json::json!({
        "name": body.name,
        "song_ids": body.song_ids.clone().unwrap_or_else(|| vec![]),
    });

    match client
        .post(&url)
        .header("apikey", &api_key)
        .header("Authorization", format!("Bearer {}", &api_key))
        .header("Content-Type", "application/json")
        .header("Prefer", "return=representation")
        .json(&new_playlist)
        .send()
        .await
    {
        Ok(res) => {
            if res.status().is_success() {
                match res.json::<Vec<Playlist>>().await {
                    Ok(mut playlists) => match playlists.pop() {
                        Some(playlist) => HttpResponse::Created().json(playlist),
                        None => HttpResponse::Created().body("Playlist agregada"),
                    },
                    Err(_) => HttpResponse::Created().body("Playlist agregada"),
                }
            } else {
                HttpResponse::BadRequest().body("Error al agregar playlist")
            }
        }
        Err(e) => {
            eprintln!("Error: {}", e);
            HttpResponse::InternalServerError().body("Error al conectar con Supabase")
        }
    }
}

#[get("/playlist")]
async fn get_playlist(client: web::Data<Client>) -> impl Responder {
    let base_url = env::var("SUPABASE_URL").expect("SUPABASE_URL no definida");
    let api_key = env::var("SECRET_API_KEY").expect("SECRET_API_KEY no definida");

    let url = format!("{}/rest/v1/playlists?select=*", base_url);

    match client
        .get(&url)
        .header("apikey", &api_key)
        .header("Authorization", format!("Bearer {}", &api_key))
        .send()
        .await
    {
        Ok(res) => match res.json::<Vec<Playlist>>().await {
            Ok(playlists) => HttpResponse::Ok().json(playlists),
            Err(e) => {
                eprintln!("Error al parsear: {}", e);
                HttpResponse::InternalServerError().body("Error al parsear respuesta")
            }
        },
        Err(_) => HttpResponse::InternalServerError().body("Error al conectar con Supabase"),
    }
}

#[post("/playlists/{playlist_id}/songs/{song_id}")]
async fn add_song_to_playlist(
    client: web::Data<Client>,
    path: web::Path<(String, String)>,
) -> impl Responder {
    let (playlist_id, song_id) = path.into_inner();
    let base_url = env::var("SUPABASE_URL").expect("SUPABASE_URL no definida");
    let api_key = env::var("SECRET_API_KEY").expect("SECRET_API_KEY no definida");

    let url = format!(
        "{}/rest/v1/playlists?id=eq.{}&select=*",
        base_url, playlist_id
    );

    let rest = client
        .get(&url)
        .header("apikey", &api_key)
        .header("Authorization", format!("Bearer {}", &api_key))
        .send()
        .await;

    let playlists = match rest {
        Ok(res) => match res.json::<Vec<Playlist>>().await {
            Ok(p) => p,
            Err(_) => return HttpResponse::InternalServerError().body("Error al parsear playlist"),
        },
        Err(_) => {
            return HttpResponse::InternalServerError().body("Error al conectar con Supabase")
        }
    };

    let playlist = match playlists.into_iter().next() {
        Some(p) => p,
        None => return HttpResponse::NotFound().body("Playlist no encontrada"),
    };

    let mut song_ids = playlist.song_ids.unwrap_or_else(|| vec![]);
    if !song_ids.contains(&song_id) {
        song_ids.push(song_id);
    }

    let url_update = format!("{}/rest/v1/playlists?id=eq.{}", base_url, playlist_id);

    let body = serde_json::json!({
        "song_ids": song_ids
    });

    match client
        .patch(&url_update)
        .header("apikey", &api_key)
        .header("Authorization", format!("Bearer {}", &api_key))
        .header("Content-Type", "application/json")
        .header("Prefer", "return=representation")
        .json(&body)
        .send()
        .await
    {
        Ok(res) => {
            if res.status().is_success() {
                match res.json::<Vec<Playlist>>().await {
                    Ok(mut playlists) => match playlists.pop() {
                        Some(playlist) => HttpResponse::Ok().json(playlist),
                        None => HttpResponse::Ok().body("Canción agregada a la playlist"),
                    },
                    Err(_) => HttpResponse::Ok().body("Canción agregada a la playlist"),
                }
            } else {
                HttpResponse::BadRequest().body("Error al agregar canción")
            }
        }
        Err(e) => {
            eprintln!("Error: {}", e);
            HttpResponse::InternalServerError().body("Error al conectar con Supabase")
        }
    }
}

#[delete("/playlists/{playlist_id}/songs/{song_id}")]
async fn delete_song_to_playlist(
    client: web::Data<Client>,
    path: web::Path<(String, String)>,
) -> impl Responder {
    let (playlist_id, song_id) = path.into_inner();

    let base_url = env::var("SUPABASE_URL").expect("SUPABASE_URL no definida");
    let api_key = env::var("SECRET_API_KEY").expect("SECRET_API_KEY no definida");

    let url = format!(
        "{}/rest/v1/playlists?id=eq.{}&select=*",
        base_url, playlist_id
    );

    let rest = client
        .get(&url)
        .header("apikey", &api_key)
        .header("Authorization", format!("Bearer {}", &api_key))
        .send()
        .await;

    let playlists = match rest {
        Ok(res) => match res.json::<Vec<Playlist>>().await {
            Ok(p) => p,
            Err(_) => return HttpResponse::InternalServerError().body("Error al parsear playlist"),
        },
        Err(_) => {
            return HttpResponse::InternalServerError().body("Error al conectar con Supabase")
        }
    };

    let playlist = match playlists.into_iter().next() {
        Some(p) => p,
        None => return HttpResponse::NotFound().body("Playlist no encontrada"),
    };

    let song_ids = playlist.song_ids.unwrap_or_else(|| vec![]);

    let nuevos_ids: Vec<String> = song_ids.into_iter().filter(|id| id != &song_id).collect();

    let url_update = format!("{}/rest/v1/playlists?id=eq.{}", base_url, playlist_id);

    let body = serde_json::json!({
        "song_ids": nuevos_ids
    });

    match client
        .patch(&url_update)
        .header("apikey", &api_key)
        .header("Authorization", format!("Bearer {}", &api_key))
        .header("Content-Type", "application/json")
        .header("Prefer", "return=representation")
        .json(&body)
        .send()
        .await
    {
        Ok(res) => {
            if res.status().is_success() {
                match res.json::<Vec<Playlist>>().await {
                    Ok(mut playlists) => match playlists.pop() {
                        Some(playlist) => HttpResponse::Ok().json(playlist),
                        None => HttpResponse::Ok().body("Canción eliminada de la playlist"),
                    },
                    Err(_) => HttpResponse::Ok().body("Canción eliminada de la playlist"),
                }
            } else {
                HttpResponse::BadRequest().body("Error al actualizar playlist")
            }
        }
        Err(e) => {
            eprintln!("Error: {}", e);
            HttpResponse::InternalServerError().body("Error al conectar con Supabase")
        }
    }
}

#[delete("/playlists/{playlist_id}")]
async fn delete_playlist(client: web::Data<Client>, path: web::Path<String>) -> impl Responder {
    let playlist_id = path.into_inner();
    let base_url = env::var("SUPABASE_URL").expect("SUPABASE_URL no definida");
    let api_key = env::var("SECRET_API_KEY").expect("SECRET_API_KEY no definida");
    let url = format!("{}/rest/v1/playlists?id=eq.{}", base_url, playlist_id);

    match client
        .delete(&url)
        .header("apikey", &api_key)
        .header("Authorization", format!("Bearer {}", &api_key))
        .send()
        .await
    {
        Ok(_res) => HttpResponse::Ok().body("Playlist eliminada"),
        Err(_e) => HttpResponse::InternalServerError().body("Error al con Supabase"),
    }
}

#[get("/playlists/{playlist_id}/songs")]
async fn filtrado_playlist(
    client: web::Data<Client>,
    query: web::Query<SongQuery>,
    path: web::Path<String>,
) -> impl Responder {
    let playlist_id = path.into_inner();
    let base_url = env::var("SUPABASE_URL").expect("SUPABASE_URL no definida");
    let api_key = env::var("SECRET_API_KEY").expect("SECRET_API_KEY no definida");

    let url = format!(
        "{}/rest/v1/playlists?id=eq.{}&select=*",
        base_url, playlist_id
    );

    let rest = client
        .get(&url)
        .header("apikey", &api_key)
        .header("Authorization", format!("Bearer {}", &api_key))
        .send()
        .await;

    let playlists = match rest {
        Ok(res) => match res.json::<Vec<Playlist>>().await {
            Ok(p) => p,
            Err(_) => return HttpResponse::InternalServerError().body("Error al parsear playlist"),
        },
        Err(_) => {
            return HttpResponse::InternalServerError().body("Error al conectar con Supabase")
        }
    };

    let playlist = match playlists.into_iter().next() {
        Some(p) => p,
        None => return HttpResponse::NotFound().body("Playlist no encontrada"),
    };

    let song_ids = playlist.song_ids.unwrap_or_else(|| vec![]);
    if song_ids.is_empty() {
        return HttpResponse::Ok().json(Vec::<Song>::new());
    }

    let ids_string = song_ids.join(",");
    let url_songs = format!("{}/rest/v1/songs?id=in.({})", base_url, ids_string);

    let rest_songs = client
        .get(&url_songs)
        .header("apikey", &api_key)
        .header("Authorization", format!("Bearer {}", &api_key))
        .send()
        .await;

    let songs = match rest_songs {
        Ok(res) => match res.json::<Vec<Song>>().await {
            Ok(s) => s,
            Err(_) => {
                return HttpResponse::InternalServerError().body("Error al parsear canciones")
            }
        },
        Err(_) => {
            return HttpResponse::InternalServerError().body("Error al conectar con Supabase")
        }
    };

    let mut canciones_ordenadas = songs;

    match query.orden.as_deref() {
        Some("artista") => canciones_ordenadas.sort_by(|a, b| a.artist.cmp(&b.artist)),
        Some("album") => canciones_ordenadas.sort_by(|a, b| a.album.cmp(&b.album)),
        Some("reciente") => canciones_ordenadas.reverse(),
        _ => {}
    }

    HttpResponse::Ok().json(canciones_ordenadas)
}

// ─── COMANDOS ───

// ─── MAIN ───
#[actix_web::main]
async fn main() {
    dotenv().ok();
    dotenv::from_filename("src/.env").ok();

    let client = Client::new();
    let playing_now: PlayingNow = Arc::new(Mutex::new(HashSet::new()));

    println!("🎵 Spoticry corriendo en http://localhost:8080");

    // ─── CLI ───
    let playing_for_cli = playing_now.clone();

    tokio::task::spawn_blocking(move || {
        let rt = tokio::runtime::Handle::current();
        let client = Client::new();

        let base_url = std::env::var("SUPABASE_URL").expect("SUPABASE_URL no definida");
        let api_key = std::env::var("SECRET_API_KEY").expect("SECRET_API_KEY no definida");

        println!("─── Consola Spoticry ───");
        println!("Comandos: listar | agregar | eliminar <id>");
        println!("───────────────────────────────────────────");

        let stdin = std::io::stdin();
        let mut lineas = std::io::BufRead::lines(stdin.lock());

        loop {
            match lineas.next() {
                Some(Ok(comando)) => {
                    match comando.trim() {
                        "listar" => {
                            rt.block_on(async {
                                let url = format!("{}/rest/v1/songs?select=*", base_url);
                                match client
                                    .get(&url)
                                    .header("apikey", &api_key)
                                    .header("Authorization", format!("Bearer {}", &api_key))
                                    .send()
                                    .await
                                {
                                    Ok(res) => {
                                        let songs: Vec<serde_json::Value> =
                                            res.json().await.unwrap_or_else(|_| vec![]);
                                        if songs.is_empty() {
                                            println!("No hay canciones");
                                        } else {
                                            for song in &songs {
                                                println!(
                                                    "{} | {} | {} | ID: {}",
                                                    song["name"].as_str().unwrap_or("?"),
                                                    song["artist"].as_str().unwrap_or("?"),
                                                    song["genre"].as_str().unwrap_or("?"),
                                                    song["id"].to_string(),
                                                );
                                            }
                                        }
                                    }
                                    Err(_) => println!("Error al conectar con el servidor"),
                                }
                            });
                        }
                        "agregar" => {
                            println!("Nombre de la canción: ");
                            let name = lineas.next().unwrap().unwrap();
                            println!("Artista: ");
                            let artist = lineas.next().unwrap().unwrap();
                            println!("Género: ");
                            let genre = lineas.next().unwrap().unwrap();
                            println!("URL del archivo de audio: ");
                            let song_url = lineas.next().unwrap().unwrap();
                            println!("URL de la imagen: ");
                            let image_url = lineas.next().unwrap().unwrap();
                            println!("Álbum: ");
                            let album = lineas.next().unwrap().unwrap();

                            let body = serde_json::json!({
                                "name": name.trim(),
                                "artist": artist.trim(),
                                "genre": genre.trim(),
                                "song_url": song_url.trim(),
                                "image_url": image_url.trim(),
                                "album": album.trim(),
                            });

                            rt.block_on(async {
                                let url = format!("{}/rest/v1/songs?select=*", base_url);
                                match client
                                    .post(&url)
                                    .header("apikey", &api_key)
                                    .header("Authorization", format!("Bearer {}", &api_key))
                                    .header("Content-Type", "application/json")
                                    .header("Prefer", "return=representation")
                                    .json(&body)
                                    .send()
                                    .await
                                {
                                    Ok(res) => {
                                        if res.status().is_success() {
                                            println!("Canción agregada");
                                        } else {
                                            println!("Error al agregar canción");
                                        }
                                    }
                                    Err(_) => println!("Error al conectar con el servidor"),
                                }
                            });
                        }
                        cmd if cmd.starts_with("eliminar") => {
                            let id = cmd.replace("eliminar", "").trim().to_string();
                            if id.is_empty() {
                                println!("Uso: eliminar <id>");
                            } else {
                                rt.block_on(async {
                                    let id = id.trim();
                                    let playing_set = playing_for_cli.lock().unwrap();
                                    if playing_set.contains(id) {
                                        println!("No se puede eliminar: la canción está siendo reproducida");
                                    } else {
                                        drop(playing_set);
                                        let url = format!("{}/rest/v1/songs?id=eq.{}", base_url, id);
                                        match client
                                            .delete(&url)
                                            .header("apikey", &api_key)
                                            .header("Authorization", format!("Bearer {}", &api_key))
                                            .send()
                                            .await
                                        {
                                            Ok(res) => {
                                                if res.status().is_success() {
                                                    println!("Canción eliminada");
                                                } else {
                                                    println!("No se puede eliminar");
                                                }
                                            }
                                            Err(_) => println!("Error al conectar con el servidor"),
                                        }
                                    }
                                });
                            }
                        }
                        _ => println!("Comando no reconocido"),
                    }
                }
                _ => break,
            }
        }
    });

    // ─── SERVIDOR ───
    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin_fn(|origin, _req_head| {
                let origin = origin.as_bytes();
                origin.starts_with(b"http://localhost:517")
                    || origin.starts_with(b"http://127.0.0.1:517")
            })
            .allowed_methods(vec!["GET", "POST", "DELETE"])
            .allowed_header(actix_web::http::header::CONTENT_TYPE)
            .max_age(3600);

        App::new()
            .wrap(cors)
            .app_data(web::PayloadConfig::default().limit(50 * 1024 * 1024))
            .app_data(web::Data::new(client.clone()))
            .app_data(web::Data::new(playing_now.clone()))
            .service(get_songs)
            .service(add_song)
            .service(delete_song)
            .service(start_stream)
            .service(stop_stream)
            .service(create_playlist)
            .service(get_playlist)
            .service(add_song_to_playlist)
            .service(delete_song_to_playlist)
            .service(delete_playlist)
            .service(filtrado_playlist)
    })
    .bind("127.0.0.1:8080")
    .expect("No se pudo iniciar el servidor")
    .run()
    .await
    .unwrap();
}
