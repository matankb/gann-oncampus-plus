import registerModule from '~/core/module';
import { waitForLoad } from '~/utils/dom';

const classnames = {
  DROPDOWN_BUTTON: 'indicator-field p3formWhite dropdown-toggle assignment-status-button',
  DROPDOWN_MENU: 'dropdown-menu',
};

const getDropdownButton = () => document.querySelector(`.${classnames.DROPDOWN_BUTTON}`) as HTMLElement;
const getDropdownMenu = () => document.querySelector(`.${classnames.DROPDOWN_MENU}`) as HTMLElement;

const showDropdownMenu = () => { getDropdownMenu().style.visibility = 'visible'; };
const hideDropdownMenu = () => { getDropdownMenu().style.visibility = 'hidden'; };

function attachListeners() {
  getDropdownButton().addEventListener('click', () => {
    showDropdownMenu();
    getDropdownMenu().addEventListener('click', e => {
      hideDropdownMenu();
      e.preventDefault();
    });
  });
  document.getElementById('app').addEventListener('click', hideDropdownMenu);
}

function autoCloseDetailStatus() {
  waitForLoad(getDropdownButton).then(attachListeners);
}

export default registerModule('{1020164f-8a6e-4bb0-aac8-d5acf0e5ad72}', {
  name: 'Auto Close Detail Status',
  main: autoCloseDetailStatus,
  showInOptions: false,
});