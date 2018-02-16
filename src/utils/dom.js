export function waitForLoad(condition) {

  return new Promise(res => {

    if (condition()) {
      return res();
    }

    const observer = new MutationObserver(() => {
      if (condition()) {
        res();
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });
  });

}

export async function registerListeners(elemsFunc, listener) {
  // elemsFunc returns an array of elements, not a NodeList
  waitForLoad(() => elemsFunc().every(e => !!e), 10) // every element is defined
    .then(() => {
      elemsFunc().forEach(e => e.addEventListener('click', listener));
    });
}

// gets list of already loaded elements by their IDs
export function getElementsByIds(ids) { return ids.map(id => document.getElementById(id)); }
// gets list of unloaded elements by their IDS; is async
export async function getUnloadedElementsByIds(ids) {
  await waitForLoad(() => ids.every(id => document.getElementById(id)));
  return getElementsByIds(ids);
}

export function constructButton(innerText, id, iClassName, onclick) {
  let elem = document.createElement('button');
  let i = document.createElement('i');
  let text = document.createTextNode(innerText);
  elem.id = id;
  elem.className = 'btn btn-sm btn-default';
  i.className = iClassName;
  elem.style = 'color:#000';
  i.style = 'visibility: visible;';
  elem.appendChild(i);
  elem.appendChild(text);
  elem.onclick = onclick;
  return elem;
}
