import registerModule from '~/module';

import {
  waitForLoad,
  constructButton,
  insertCss,
  addEventListener,
} from '~/utils/dom';

import { appendMobileAssignmentCenterMenuLink } from '~/shared/assignments-center';

import style from './style.css';

const selectors = {
  activeButton: style.locals['active-button'],
};

const completedStatusIndices = [
  4, // completed
  5, // graded
];

function isChecked(checkbox) {
  return checkbox.classList.contains('active');
}

async function runFilterDialog(fn) {
  document.getElementById('filter-status').click();

  const hideDialogStyle = insertCss(`
    .modal-backdrop, .modal-dialog {
      display: none;
    }
  `);

  await waitForLoad(() => document.querySelector('.modal-dialog'));
  const dialog = document.querySelector('.modal-dialog');
  try {
    await fn(dialog);
    dialog.querySelector('#btn-filter-apply').click();
  } finally {
    // reset modal style even if error occurs
    // failure to do so could break all other dialogs
    hideDialogStyle.remove();
  }
}

async function onFilterStatusClick(hideCompletedButtons) {
  const applyButton = await waitForLoad(() => document.querySelector('#btn-filter-apply'));
  const dialog = applyButton.closest('.modal-dialog');

  applyButton.addEventListener('click', () => {
    const checkboxes = dialog.querySelectorAll('.status-button');
    let allUnchecked = true;
    for (const index of completedStatusIndices) {
      allUnchecked = allUnchecked && !isChecked(checkboxes[index]);
    }
    for (const button of hideCompletedButtons) {
      button.classList.toggle(selectors.activeButton, allUnchecked);
      button.disabled = false;
    }
  });
}

async function toggleHidden({ target: button }) {
  button.disabled = true;
  await runFilterDialog(dialog => {
    const checkboxes = dialog.querySelectorAll('.status-button');
    const desiredState = button.classList.contains(selectors.activeButton);

    for (const index of completedStatusIndices) {
      if (isChecked(checkboxes[index]) !== desiredState) {
        checkboxes[index].querySelector('.p3icon-check').click();
      }
    }
  });
}

const domQuery = {
  desktop: () => document.querySelector('#filter-status'),
  mobile: () => document.querySelector('#filter-status-menu'),
};

async function hideCompleted(opts, unloaderContext) {
  const styles = insertCss(style.toString());
  unloaderContext.addRemovable(styles);

  await waitForLoad(() => domQuery.desktop() && domQuery.mobile());

  const filterStatusButton = domQuery.desktop();
  const filterStatusLink = domQuery.mobile();

  const button = constructButton('Hide Completed', '', 'fa fa-check', toggleHidden);
  filterStatusButton.parentNode.appendChild(button);
  unloaderContext.addRemovable(button);

  const mobileLink = appendMobileAssignmentCenterMenuLink('Hide Completed', toggleHidden, 0);
  unloaderContext.addRemovable(mobileLink);

  const handleFilterStatus = () => onFilterStatusClick([button, mobileLink]);
  const desktopFilterStatusListener = addEventListener(
    filterStatusButton,
    'click',
    handleFilterStatus,
  );
  const mobileFilterStatusListener = addEventListener(
    filterStatusLink,
    'click',
    handleFilterStatus,
  );
  unloaderContext.addRemovable(desktopFilterStatusListener);
  unloaderContext.addRemovable(mobileFilterStatusListener);

  // open and apply dialog, which updates button to current filter
  // used for dynamic loading
  runFilterDialog(() => {});
}

export default registerModule('{6394e18f-5b51-44f4-bb3c-1144ab97945a}', {
  name: 'Hide Completed Assignments Button',
  description: 'Button to quickly show or hide completed and graded assignments',
  main: hideCompleted,
});
