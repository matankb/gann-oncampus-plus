import classNames from 'classnames';

import registerModule from '~/module';

import fuzzyMatch from '~/utils/search';
import constants from '~/utils/style-constants';
import { createElement, waitForLoad, insertCss } from '~/utils/dom';
import { coursesListLoaded, observeCoursesBar } from '~/shared/progress';

import style from './style.css';

const CHECKED_ATTR = 'data-gocp-courses_filter-checked';

const selectors = {
  hidden: style.locals.hidden,
  filterInput: style.locals['filter-input'],
  dropdownButton: style.locals['dropdown-button'],
};

let courses;
const filters = [];

function generateCourseList() {
  const rows = document.getElementById('coursesContainer').getElementsByClassName('row');
  return Array.from(rows).map(e => ({
    elem: e,
    name: e.querySelector('h3').textContent,
    grade: e.querySelector('.showGrade').textContent.trim(),
  }));
}

function regenerateCoursesList() {
  if (!courses || !document.body.contains(courses[0].elem)) {
    courses = generateCourseList();
  }
}

function runFilter() {
  regenerateCoursesList();
  const kept = filters.reduce((arr, filter) => arr.filter(filter), courses);
  // [audit] perhaps use dataset
  courses.forEach(course => course.elem.classList.add(selectors.hidden));
  kept.forEach(course => course.elem.classList.remove(selectors.hidden));
}

function handleSearch(course) {
  const query = document.querySelector(`.${selectors.filterInput}`).value;
  return fuzzyMatch(query, course.name);
}
filters.push(handleSearch);

function generateDropdown(items) {

  const wrap = <ul className="dropdown-menu" role="menu" />;

  items.forEach(item => {
    const a = <a href="#">{ item.name }</a>;
    const li = <li>{ a } </li>;

    li.setAttribute(CHECKED_ATTR, 'false');

    wrap.appendChild(li);

    a.addEventListener('mousedown', e => {
      e.preventDefault();
      e.stopPropagation();
      const newChecked = li.getAttribute(CHECKED_ATTR) !== 'true';
      li.setAttribute(CHECKED_ATTR, String(newChecked));
      li.className = newChecked ? 'active' : '';
      runFilter();

      const anyChecked = document.querySelectorAll(`li[${CHECKED_ATTR}="true"]`).length > 0;
      const filterButton = document.querySelector(`.${selectors.dropdownButton}`);
      filterButton.style.background = anyChecked ? constants.successGreen : 'white';
      filterButton.children[0].style.color = anyChecked ? 'white' : 'black';
    });

    a.addEventListener('click', e => e.preventDefault());

    filters.push(course => {
      const checked = li.getAttribute(CHECKED_ATTR) === 'true';
      return checked ? item.filter(course) : true;
    });
  });

  return wrap;
}

function getDropdownMenu() {
  return document.querySelector(`.${selectors.dropdownButton}`).parentNode.children[0];
}
function hideDropdownMenu() {
  getDropdownMenu().style.display = 'none';
}
function showDropdownMenu() {
  getDropdownMenu().style.display = 'block';
  document.addEventListener('mousedown', hideDropdownMenu, {
    once: true,
  });
}
function toggleDropdownMenu() {
  const wasShown = getDropdownMenu().style.display === 'block';
  if (wasShown) {
    hideDropdownMenu();
  } else {
    showDropdownMenu();
  }
}

function renderFilterBar() {

  const dropdownFilters = [
    {
      name: 'Hide Ungraded Courses',
      filter: course => course.grade !== '--',
    },
  ];

  const input = (
    <input
      className={ classNames('form-control', selectors.filterInput) }
      type="search"
      placeholder="Search Courses"
      autocomplete="off"
      onInput={runFilter}
    />
  );

  const dropdownButton = (
    <button
      className={ classNames('btn btn-default btn-sm dropdown-toggle', selectors.dropdownButton) }
      dataset={{ toggle: 'dropdown' }}
      onClick={ toggleDropdownMenu }
      onMouseDown={ e => e.stopPropagation() }
    >
      <i className="fa fa-ellipsis-h" />
    </button>
  );

  const wrap = (
    <div className="btn-group" style={{ display: 'inline' }}>
      { generateDropdown(dropdownFilters) }
      { input }
      { dropdownButton }
    </div>
  );

  document.getElementById('showHideGrade').after(wrap);
  document.getElementById('showHideGrade').style.marginRight = '15px';

  return wrap;
}

const domQuery = () => (
  coursesListLoaded() &&
  document.getElementById('showHideGrade')
);

async function addCoursesFilterBar() {
  await waitForLoad(domQuery);
  return renderFilterBar();
}

async function coursesFilter(opts, unloaderContext) {
  const styles = insertCss(style.toString());
  unloaderContext.addRemovable(styles);

  let coursesFilterBarUnloader = unloaderContext.addRemovable(await addCoursesFilterBar());

  const coursesBarObserver = await observeCoursesBar(async () => {
    coursesFilterBarUnloader.remove();
    coursesFilterBarUnloader = unloaderContext.addRemovable(await addCoursesFilterBar());
  });
  unloaderContext.addRemovable(coursesBarObserver);

}

function unloadCoursesFilter() {
  const hiddenCourses = document.querySelectorAll(`#courseCollapse .${selectors.hidden}`);
  for (const course of hiddenCourses) {
    course.classList.remove(selectors.hidden);
  }
}

export default registerModule('{e2c18d75-5264-4177-97b0-5c6d65fb1496}', {
  name: 'Courses Filter',
  description: 'Search courses and hide ungraded ones.',
  main: coursesFilter,
  unload: unloadCoursesFilter,
});
