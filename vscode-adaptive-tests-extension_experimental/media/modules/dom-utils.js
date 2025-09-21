/**
 * DOM Utilities
 * Safe DOM manipulation helpers
 */

/**
 * Clear all children from an element
 */
export function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Create element with properties and children
 */
export function createElement(tag, props = {}, children = []) {
    const element = document.createElement(tag);

    // Set properties
    Object.entries(props).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'textContent') {
            element.textContent = value;
        } else if (key.startsWith('data-')) {
            element.setAttribute(key, value);
        } else if (key.startsWith('aria-')) {
            element.setAttribute(key, value);
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else {
            element[key] = value;
        }
    });

    // Add children
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child) {
            element.appendChild(child);
        }
    });

    return element;
}

/**
 * Create select options safely
 */
export function createOptions(values, selectedValues = []) {
    return values.map(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        option.selected = selectedValues.includes(value);
        return option;
    });
}

/**
 * Replace element's children with new elements
 */
export function replaceChildren(element, children) {
    clearElement(element);
    children.forEach(child => {
        if (child) {
            element.appendChild(child);
        }
    });
}

/**
 * Set button loading state safely
 */
export function setButtonLoading(button, loading, loadingText = 'Loading...', originalText = 'Submit') {
    if (loading) {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        clearElement(button);

        const spinner = createElement('span', {
            className: 'progress-spinner',
            'aria-hidden': 'true'
        });

        const text = createElement('span', {
            textContent: loadingText
        });

        button.appendChild(spinner);
        button.appendChild(text);
    } else {
        button.disabled = false;
        button.removeAttribute('aria-busy');
        button.textContent = originalText;
    }
}

/**
 * Create error message element
 */
export function createErrorElement(message, actions = []) {
    const container = createElement('div', {
        className: 'error-message',
        role: 'alert'
    });

    const text = createElement('p', {
        textContent: message
    });
    container.appendChild(text);

    if (actions.length > 0) {
        const actionsContainer = createElement('div', {
            className: 'error-actions'
        });

        actions.forEach(({ text, onClick }) => {
            const button = createElement('button', {
                textContent: text,
                className: 'error-action-btn'
            });
            button.addEventListener('click', onClick);
            actionsContainer.appendChild(button);
        });

        container.appendChild(actionsContainer);
    }

    return container;
}