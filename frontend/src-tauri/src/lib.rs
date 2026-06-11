use tauri::Manager;
use tauri_plugin_shell::ShellExt;

#[tauri::command]
fn get_api_port() -> u16 {
    8765
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let sidecar_command = app
                .shell()
                .sidecar("reviewbot-api")
                .expect("failed to find reviewbot-api sidecar");

            let (_rx, _child) = sidecar_command
                .spawn()
                .expect("failed to spawn reviewbot-api sidecar");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_api_port])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
