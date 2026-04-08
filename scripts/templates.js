function generateTodoHTML(element) {
    return `
    <div draggable="true" ondragstart="startDragging(${element['id']})" class="todo">
        <header class="todo-header">
            <div class="headline__boards">${element['title']}</div>
        </header>
        <section class="todo-content">
            <div class="todo-description">${element['description']}</div>
        </section>
        <div class="subtask" id="subtask">${getSubtaskBarHTML(element)}1/2</div>
        <footer class="todo-footer">
            <div class="profile__boards" id="profile__boards">MM</div>
            <button class="profile__list" aria-label="Delete task ${element['title']}"/>&#187;</button>
            <div id="profile__list"></div>
        </footer>
    </div>`;
}