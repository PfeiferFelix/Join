function getCircleUserTemplate(nameAbbreviation = "DG") {
    return `
        <svg width="50" height="50" viewBox="0 0 80 80" aria-hidden="true">
            <circle class="header__circle" cx="40" cy="40" r="38" stroke="#555" stroke-width="4" fill="white" />
            <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="28" font-family="Inter, sans-serif" fill="#4a90e2" font-weight="700">${nameAbbreviation}</text>
        </svg>
    `;
}

function getUserMenuTemplate() {
    return `
        <ul class="header__user-list fs-small-regular fc-lightgrey">
            <li><a href="legal-notice.html">Legal Notice</a></li>
            <li><a href="privacy-policy.html">Privacy Policy</a></li>
            <li><a href="login.html">Log Out</a></li>
        </ul>
    `;
}
