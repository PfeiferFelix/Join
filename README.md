# Join 📋

A Kanban-style task management tool inspired by Trello, built with vanilla HTML, CSS, and JavaScript, with Firebase as the backend for real-time data storage.

## Features

- **User accounts**: registration, login, and guest login
- **Boards**: Kanban board with drag-and-drop tasks across "To do", "In progress", "Await feedback", and "Done" columns (touch support included)
- **Add / edit tasks**: title, description, due date, priority, category, subtasks, and assigned contacts
- **Contacts**: add, edit, delete, and assign contacts to tasks
- **Summary dashboard**: overview of task counts, urgent tasks, and upcoming deadlines
- **Search**: live search/filter for tasks on the board
- **Responsive design**: mobile-friendly layouts and navigation
- **Legal notice & privacy policy** pages included

## Tech Stack

Plain HTML5, CSS3, and JavaScript — no frameworks or build tools. Data is persisted via [Firebase Realtime Database](https://firebase.google.com/products/realtime-database), with local storage used for syncing and offline state. [SweetAlert2](https://sweetalert2.github.io/) is used for alert dialogs.

## Getting Started

No build step required — this is a static site.

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

> Helper scripts `up.sh` / `up.bat` are included to quickly commit and push changes (`git pull && git add . && git commit -m "<message>" && git push`).

## Project Structure

```
├── index.html            # Login page
├── registration.html      # Sign-up page
├── summary.html            # Dashboard overview
├── boards.html              # Kanban board
├── add-task.html             # Add task form
├── contacts.html               # Contacts management
├── help.html / legal-notice.html / privacy-policy.html
├── scripts/                       # App logic (boards, contacts, login, drag & drop, Firebase sync, etc.)
├── styles/                          # Page and component styles
├── assets/                            # Icons, logos, images
├── fonts/                               # Inter font family
└── libs/                                  # Third-party libraries (SweetAlert2)
```

## Contributors

- Felix Pfeifer
- Dustin Güttner
- JiorgoV
- MarcelN911
- MAX

## License

No license specified.
