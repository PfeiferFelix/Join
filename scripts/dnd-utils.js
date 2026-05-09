// Hilfsfunktionen für Drag & Drop

export function removeTouchDropHighlights() {
    document.querySelectorAll('.board__list--touch-target').forEach(list => {
        list.classList.remove('board__list--touch-target');
    });
}

export function getDropZoneAtPoint(clientX, clientY, categoryMap) {
    const element = document.elementFromPoint(clientX, clientY);
    const list = element?.closest('.board__list');
    if (!list) return null;
    return categoryMap[list.id] ? list : null;
}

export function setTaskDragging(taskElement, dragging) {
    if (dragging) {
        taskElement.classList.add('task--touch-dragging');
    } else {
        taskElement.classList.remove('task--touch-dragging');
    }
}
