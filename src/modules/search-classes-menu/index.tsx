import registerModule from '~/core/module';
import fuzzyMatch from '~/utils/search';

import { createElement, waitForLoad, insertCss, addEventListener } from '~/utils/dom';
import {
  getDesktopMenu,
  getDesktopCourses,
  getMobileCourses,
  getMobileMenu,
  ClassesMenuCourse,
} from '~/shared/classes-menu';

import style from './style.css';
import { Removable, UnloaderContext } from '~/core/module-loader';

const selectors = {
  desktopSearchbar: style.locals['desktop-search-bar'],
  mobileSearchbar: style.locals['mobile-search-bar'],
  mobileSearchbarWrap: style.locals['mobile-search-bar-wrap'],
  hiddenCourse: {
    desktop: style.locals['hidden-course-desktop'],
    mobile: style.locals['hidden-course-mobile'],
  },
  highlightedCourse: {
    desktop: style.locals['highlighted-course-desktop'],
    mobile: style.locals['highlighted-course-mobile'],
  },
  desktopClassesMenu: 'subnav',
};

// ESLint doesn't recognize that getCourses is an override
/* eslint-disable class-methods-use-this */

abstract class ClassFilter implements Removable {

  input: HTMLInputElement;
  match: ClassesMenuCourse;
  hiddenClassName: string;
  highlightedClassName: string;

  constructor(inputId: string, hiddenClassName: string, highlightedClassName: string) {
    var input = <input
        id={inputId}
        type="search"
        autocomplete="off"
        placeholder="Search Classes"
      />;

    this.input.addEventListener('input', () => this.handleSearch());
    this.input.addEventListener('keypress', e => this.handleKeypress(e));
    this.match = null;

    this.hiddenClassName = hiddenClassName;
    this.highlightedClassName = highlightedClassName;
  }

  showSearchbar() {
    this.input.value = '';
    this.handleSearch();
    this.input.focus();
  }

  getCurrentSearch() {
    return this.input.value.toLowerCase().trim();
  }

  handleSearch() {
    const matches = [];
    const courses = this.getCourses();
    for (const course of courses) {
      const isMatched = fuzzyMatch(this.getCurrentSearch(), course.title);
      if (isMatched) {
        matches.push(course);
      }
      this.setCourseShown(course.elem, isMatched);
      this.setCourseHighlighted(course.elem, false);
    }

    if (matches.length === 1) {
      this.match = matches[0]; // eslint-disable-line prefer-destructuring
      this.setCourseHighlighted(this.match.elem, true);
    }
  }

  handleKeypress(e: KeyboardEvent) {
    if (this.match && e.key === 'Enter') {
      this.goToMatch();
    }
  }

  goToMatch() {
    this.match.elem.querySelector('a').click();
  }

  setCourseShown(elem: HTMLElement, isShown: boolean) {
    elem.classList.toggle(this.hiddenClassName, !isShown);
  }

  setCourseHighlighted(elem: HTMLElement, isHighlighted: boolean) {
    elem.classList.toggle(this.highlightedClassName, isHighlighted);
  }

  abstract getCourses(): ClassesMenuCourse[];
  abstract mountInput(node: Element): void;
  abstract remove(): void;

}

class DesktopClassFilter extends ClassFilter {
  constructor() {
    super(
      selectors.desktopSearchbar,
      selectors.hiddenCourse.desktop,
      selectors.highlightedCourse.desktop,
    );
  }

  getCourses() {
    return getDesktopCourses()
      .filter(({ elem }) => {
        return elem.id !== selectors.desktopSearchbar && !elem.closest('.subnavfooter');
      });
  }

  mountInput(node: Element) {
    node.prepend(this.input);
  }

  remove() {
    this.input.remove();
  }
}

class MobileClassFilter extends ClassFilter {

  wrap: HTMLElement;

  constructor() {
    super(
      selectors.mobileSearchbar,
      selectors.hiddenCourse.mobile,
      selectors.highlightedCourse.mobile,
    );
  }

  getCourses() {
    return getMobileCourses()
      .filter(({ elem }) => elem.id !== selectors.mobileSearchbarWrap);
  }

  mountInput(node: Element) {
    this.wrap = (
      <li id={selectors.mobileSearchbarWrap}>
        <span className="mobile-group-page-link-1">{ this.input }</span>
      </li>
    );
    node.prepend(this.wrap);
  }

  remove() {
    this.wrap.remove();
  }
}

/* eslint-enable class-methods-use-this */

const domQuery = {
  desktop: getDesktopMenu,
  mobile: getMobileMenu,
};

function searchClassesMenu(opts: void, unloaderContext: UnloaderContext) {
  insertCss(style.toString());

  waitForLoad(domQuery.desktop).then(() => {
    const classFilter = new DesktopClassFilter();
    classFilter.mountInput(getDesktopMenu());
    unloaderContext.addRemovable(classFilter);

    const classesMenu = document.querySelector('#group-header-Classes').parentNode;
    const showListener = addEventListener(classesMenu, 'mouseenter', () => {
      classFilter.showSearchbar();
    });
    unloaderContext.addRemovable(showListener);
  });

  waitForLoad(domQuery.mobile).then(() => {
    const classFilter = new MobileClassFilter();
    classFilter.mountInput(domQuery.mobile());
    unloaderContext.addRemovable(classFilter);

    const classesMenu = document.querySelector('#mobile-group-header-Classes');
    const showListener = addEventListener(classesMenu, 'click', () => {
      classFilter.showSearchbar();
    });
    unloaderContext.addRemovable(showListener);
  });
}

export default registerModule('{3eb98c28-475a-43d7-ae80-721fffcdda11}', {
  name: 'Search Classes Menu',
  init: searchClassesMenu,
});