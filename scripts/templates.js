function generateTodoHTML(element) {
    return `<div draggable="true" ondragstart="startDragging(${element['id']})" class="todo">
        <div class="headline__boards">${element['title']}</div>
        <div class="todo-description">${element['description']}</div>
        <footer class="todo-footer">
        <div class="profile__boards" id="profile__boards">MM</div>
        <button class="profile__list" aria-label="Delete task ${element['title']}">&#187;</button>
        <div id="profile__list"></div>
        </footer>
    </div>`;
}
