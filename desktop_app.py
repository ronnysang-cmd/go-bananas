#!/usr/bin/env python3
import subprocess
import time
import threading
import webbrowser
import tkinter as tk
from tkinter import messagebox
import os
import signal
import sys

class GoBananasApp:
    def __init__(self):
        self.server_process = None
        self.root = tk.Tk()
        self.setup_ui()
        
    def setup_ui(self):
        self.root.title("🍌 Go Bananas")
        self.root.geometry("400x300")
        self.root.configure(bg='#1a1a1a')
        
        # Title
        title = tk.Label(self.root, text="🍌 Go Bananas", 
                        font=("Arial", 24, "bold"), 
                        fg="#00d4ff", bg="#1a1a1a")
        title.pack(pady=30)
        
        # Status
        self.status_label = tk.Label(self.root, text="Ready to start", 
                                   font=("Arial", 12), 
                                   fg="#ffffff", bg="#1a1a1a")
        self.status_label.pack(pady=10)
        
        # Start button
        self.start_btn = tk.Button(self.root, text="Start App", 
                                 command=self.start_app,
                                 font=("Arial", 14, "bold"),
                                 bg="#00d4ff", fg="white",
                                 width=15, height=2)
        self.start_btn.pack(pady=20)
        
        # Stop button
        self.stop_btn = tk.Button(self.root, text="Stop App", 
                                command=self.stop_app,
                                font=("Arial", 14, "bold"),
                                bg="#ff4444", fg="white",
                                width=15, height=2,
                                state="disabled")
        self.stop_btn.pack(pady=10)
        
        # Open browser button
        self.browser_btn = tk.Button(self.root, text="Open in Browser", 
                                   command=self.open_browser,
                                   font=("Arial", 12),
                                   bg="#333333", fg="white",
                                   width=15,
                                   state="disabled")
        self.browser_btn.pack(pady=10)
        
        # Handle window close
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
        
    def start_app(self):
        try:
            self.status_label.config(text="Starting server...")
            self.start_btn.config(state="disabled")
            
            # Start the Node.js server
            self.server_process = subprocess.Popen(
                ["node", "server.js"],
                cwd=os.path.dirname(os.path.abspath(__file__))
            )
            
            # Wait a moment for server to start
            time.sleep(3)
            
            # Open browser
            webbrowser.open("http://localhost:5500")
            
            self.status_label.config(text="App running on http://localhost:5500")
            self.stop_btn.config(state="normal")
            self.browser_btn.config(state="normal")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to start app: {str(e)}")
            self.status_label.config(text="Failed to start")
            self.start_btn.config(state="normal")
    
    def stop_app(self):
        if self.server_process:
            self.server_process.terminate()
            self.server_process = None
            
        self.status_label.config(text="App stopped")
        self.start_btn.config(state="normal")
        self.stop_btn.config(state="disabled")
        self.browser_btn.config(state="disabled")
    
    def open_browser(self):
        webbrowser.open("http://localhost:5500")
    
    def on_closing(self):
        if self.server_process:
            self.server_process.terminate()
        self.root.destroy()
        sys.exit()
    
    def run(self):
        self.root.mainloop()

if __name__ == "__main__":
    app = GoBananasApp()
    app.run()