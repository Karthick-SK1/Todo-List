import tkinter as tk
from tkinter import messagebox
import sqlite3

# Function to add a task to the database
def add_task(event=None):
    task = task_entry.get()
    if task:
        conn.execute("INSERT INTO tasks (task) VALUES (?)", (task,))
        conn.commit()
        update_listbox()
        task_entry.delete(0, tk.END)
    else:
        messagebox.showwarning("Warning", "Please enter a task.")

# Function to move a task to completed tasks
def tick_task(event):
    index = tasks_listbox.nearest(event.y)
    selected_task = tasks[index]
    conn.execute("INSERT INTO completed_tasks (task) VALUES (?)", (selected_task,))
    conn.execute("DELETE FROM tasks WHERE task=?", (selected_task,))
    conn.commit()
    update_listbox()
    update_completed_listbox()

# Function to delete a task
def delete_task(event):
    index = tasks_listbox.nearest(event.y)
    selected_task = tasks[index]
    conn.execute("DELETE FROM tasks WHERE task=?", (selected_task,))
    conn.commit()
    update_listbox()

# Function to update the tasks listbox
def update_listbox():
    tasks_listbox.delete(0, tk.END)
    tasks.clear()
    cursor = conn.execute("SELECT * FROM tasks")
    for row in cursor:
        tasks_listbox.insert(tk.END, row[1])
        tasks.append(row[1])

# Function to update the completed tasks listbox
def update_completed_listbox():
    completed_listbox.delete(0, tk.END)
    completed_tasks.clear()
    cursor = conn.execute("SELECT * FROM completed_tasks")
    for row in cursor:
        completed_listbox.insert(tk.END, row[1])
        completed_tasks.append(row[1])

# Main Tkinter window
root = tk.Tk()
root.title("To-Do List")

# Create database or connect if it already exists
conn = sqlite3.connect("todo.db")
conn.execute('''CREATE TABLE IF NOT EXISTS tasks
             (id INTEGER PRIMARY KEY AUTOINCREMENT,
             task TEXT NOT NULL)''')
conn.execute('''CREATE TABLE IF NOT EXISTS completed_tasks
             (id INTEGER PRIMARY KEY AUTOINCREMENT,
             task TEXT NOT NULL)''')

tasks = []
completed_tasks = []

# GUI elements
label_today = tk.Label(root, text="Today's Tasks")
label_today.pack()

task_entry = tk.Entry(root, width=50)
task_entry.pack(pady=10)
task_entry.bind("<Return>", add_task)

add_button = tk.Button(root, text="Add Task", command=add_task)
add_button.pack()

tasks_listbox = tk.Listbox(root, width=50)
tasks_listbox.pack(pady=10)

label_completed = tk.Label(root, text="Completed Tasks")
label_completed.pack()

completed_listbox = tk.Listbox(root, width=50)
completed_listbox.pack(pady=10)

update_listbox()
update_completed_listbox()

# Bind events for drag and drop
tasks_listbox.bind("<Button-1>", lambda event: tasks_listbox.scan_mark(event.x, event.y))
tasks_listbox.bind("<B1-Motion>", lambda event: tasks_listbox.scan_dragto(event.x, event.y, gain=1))
tasks_listbox.bind("<ButtonRelease-1>", tick_task)

root.mainloop()
