/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { imageBasePath } from '../Client';
import { addProp, isSet } from '../Helpers';
import Event from './Event';
import EventObject from './EventObject';
import EventSource from './EventSource';
import { fit, getDocumentScrollOrigin, write } from './Utils';

/**
 * Class: PopupMenu
 *
 * Basic popup menu. To add a vertical scrollbar to a given submenu, the
 * following code can be used.
 *
 * (code)
 * var mxPopupMenuShowMenu = mxPopupMenu.prototype.showMenu;
 * mxPopupMenu.prototype.showMenu = function()
 * {
 *   mxPopupMenuShowMenu.apply(this, arguments);
 *
 *   this.div.style.overflowY = 'auto';
 *   this.div.style.overflowX = 'hidden';
 *   this.div.style.maxHeight = '160px';
 * };
 * (end)
 *
 * Constructor: mxPopupMenu
 *
 * Constructs a popupmenu.
 *
 * Event: mxEvent.SHOW
 *
 * Fires after the menu has been shown in <popup>.
 */
const PopupMenu = (factoryMethod) => {
  /**
   * Variable: submenuImage
   *
   * URL of the image to be used for the submenu icon.
   */
  const [getSubmenuImage, setSubmenuImage] = addProp(
    imageBasePath + '/submenu.gif'
  );

  /**
   * Variable: zIndex
   *
   * Specifies the zIndex for the popupmenu and its shadow. Default is 10006.
   */
  const [getZIndex, setZIndex] = addProp(10006);

  /**
   * Variable: factoryMethod
   *
   * Function that is used to create the popup menu. The function takes the
   * current panning handler, the <mxCell> under the mouse and the mouse
   * event that triggered the call as arguments.
   */
  const [getFactoryMethod, setFactoryMethod] = addProp(factoryMethod);

  /**
   * Variable: useLeftButtonForPopup
   *
   * Specifies if popupmenus should be activated by clicking the left mouse
   * button. Default is false.
   */
  const [isUseLeftButtonForPopup, setUseOeftButtonForPopup] = addProp(false);

  /**
   * Variable: enabled
   *
   * Specifies if events are handled. Default is true.
   */
  const [isEnabled, setEnabled] = addProp(true);

  /**
   * Variable: itemCount
   *
   * Contains the number of times <addItem> has been called for a new menu.
   */
  const [getItemCount, setItemCount] = addProp(0);

  /**
   * Variable: autoExpand
   *
   * Specifies if submenus should be expanded on mouseover. Default is false.
   */
  const [isAutoExpand, setAutoExpand] = addProp(false);

  /**
   * Variable: smartSeparators
   *
   * Specifies if separators should only be added if a menu item follows them.
   * Default is false.
   */
  const [isSmartSeparators, setSmartSeparators] = addProp(false);

  /**
   * Variable: labels
   *
   * Specifies if any labels should be visible. Default is true.
   */
  const [isLabels, setLabels] = addProp(true);
  const [getTable, setTable] = addProp();
  const [getTbody, setTbody] = addProp();
  const [getDiv, setDiv] = addProp();
  const [isContainsItems, setContainsItems] = addProp();
  const [isWillAddSeparator, setWillAddSeparator] = addProp();
  const [getEventReceiver, setEventReceiver] = addProp();
  const [getActiveRow, setActiveRow] = addProp();

  /**
   * Function: init
   *
   * Initializes the shapes required for this vertex handler.
   */
  const init = () => {
    // Adds the inner table
    const table = setTable(document.createElement('table'));
    table.className = 'mxPopupMenu';

    const tbody = setTbody(document.createElement('tbody'));
    table.appendChild(tbody);

    // Adds the outer div
    const div = setDiv(document.createElement('div'));
    div.className = 'mxPopupMenu';
    div.style.display = 'inline';
    div.style.zIndex = getZIndex();
    div.appendChild(getTable());

    // Disables the context menu on the outer div
    Event.disableContextMenu(getDiv());
  };

  /**
   * Function: isPopupTrigger
   *
   * Returns true if the given event is a popupmenu trigger for the optional
   * given cell.
   *
   * Parameters:
   *
   * me - <mxMouseEvent> that represents the mouse event.
   */
  const isPopupTrigger = (mE) =>
    mE.isPopupTrigger() ||
    (isUseLeftButtonForPopup() && Event.isLeftMouseButton(mE.getEvent()));

  /**
   * Function: addItem
   *
   * Adds the given item to the given parent item. If no parent item is specified
   * then the item is added to the top-level menu. The return value may be used
   * as the parent argument, ie. as a submenu item. The return value is the table
   * row that represents the item.
   *
   * Paramters:
   *
   * title - String that represents the title of the menu item.
   * image - Optional URL for the image icon.
   * funct - Function associated that takes a mouseup or touchend event.
   * parent - Optional item returned by <addItem>.
   * iconCls - Optional string that represents the CSS class for the image icon.
   * IconsCls is ignored if image is given.
   * enabled - Optional boolean indicating if the item is enabled. Default is true.
   * active - Optional boolean indicating if the menu should implement any event handling.
   * Default is true.
   * noHover - Optional boolean to disable hover state.
   */
  const addItem = (
    title,
    image,
    funct,
    parent = me,
    iconCls,
    enabled,
    active,
    noHover
  ) => {
    setItemCount(getItemCount() + 1);

    // Smart separators only added if element contains items
    if (parent.isWillAddSeparator()) {
      if (parent.isContainsItems()) {
        addSeparator(parent, true);
      }

      parent.setWillAddSeparator(false);
    }

    parent.setContainsItems(true);
    const tr = document.createElement('tr');
    tr.className = 'mxPopupMenuItem';
    const col1 = document.createElement('td');
    col1.className = 'mxPopupMenuIcon';

    // Adds the given image into the first column
    if (isSet(image)) {
      const img = document.createElement('img');
      img.src = image;
      col1.appendChild(img);
    } else if (isSet(iconCls)) {
      const div = document.createElement('div');
      div.className = iconCls;
      col1.appendChild(div);
    }

    tr.appendChild(col1);

    if (isLabels()) {
      const col2 = document.createElement('td');
      col2.className =
        'mxPopupMenuItem' + (isSet(enabled) && !enabled ? ' mxDisabled' : '');

      write(col2, title);
      col2.align = 'left';
      tr.appendChild(col2);

      const col3 = document.createElement('td');
      col3.className =
        'mxPopupMenuItem' + (isSet(enabled) && !enabled ? ' mxDisabled' : '');
      col3.style.paddingRight = '6px';
      col3.style.textAlign = 'right';

      tr.appendChild(col3);

      if (isUnset(parent.getDiv())) {
        createSubmenu(parent);
      }
    }

    parent.tbody.appendChild(tr);

    if (isActive() && isEnabled()) {
      let currentSelection;

      Event.addGestureListeners(
        tr,
        (evt) => {
          setEventReceiver(tr);

          if (
            parent.getActiveRow() !== tr &&
            parent.getActiveRow() !== parent
          ) {
            if (
              isSet(parent.getActiveRow()) &&
              isSet(parent.getActiveRow().div.parentNode)
            ) {
              hideSubmenu(parent);
            }

            if (isSet(tr.getDiv())) {
              showSubmenu(parent, tr);
              parent.setActiveRow(tr);
            }
          }

          Event.consume(evt);
        },
        (evt) => {
          if (
            parent.getActiveRow() !== tr &&
            parent.getActiveRow() !== parent
          ) {
            if (
              isSet(parent.getActiveRow()) &&
              isSet(parent.getActiveRow().div.parentNode)
            ) {
              hideSubmenu(parent);
            }

            if (isAutoExpand() && isSet(tr.getDiv())) {
              showSubmenu(parent, tr);
              parent.setActiveRow(tr);
            }
          }

          // Sets hover style because TR in IE doesn't have hover
          if (!noHover) {
            tr.className = 'mxPopupMenuItemHover';
          }
        },
        (evt) => {
          // EventReceiver avoids clicks on a submenu item
          // which has just been shown in the mousedown
          if (getEventReceiver() === tr) {
            if (parent.getActiveRow() !== tr) {
              hideMenu();
            }

            if (isSet(funct)) {
              funct(evt);
            }
          }

          setEventReceiver();
          Event.consume(evt);
        }
      );

      // Resets hover style because TR in IE doesn't have hover
      if (!noHover) {
        Event.addListener(
          tr,
          'mouseout',
          (evt) => (tr.className = 'mxPopupMenuItem')
        );
      }
    }

    tr.getTable = () => tr.table;
    tr.setTable = (t) => {
      tr.table = t;
      return t;
    };
    tr.getTbody = () => tr.tbody;
    tr.setTbody = (t) => {
      tr.tbody = t;
      return t;
    };
    tr.getDiv = () => tr.div;
    tr.setDiv = (d) => {
      tr.div = d;
      return d;
    };
    tr.getActiveRow = () => tr.activeRow;
    tr.setActiveRow = (r) => {
      tr.activeRow = r;
      return r;
    };

    return tr;
  };

  /**
   * Adds a checkmark to the given menuitem.
   */
  const addCheckmark = (item, img) => {
    const td = item.firstChild.nextSibling;
    td.style.backgroundImage = "url('" + img + "')";
    td.style.backgroundRepeat = 'no-repeat';
    td.style.backgroundPosition = '2px 50%';
  };

  /**
   * Function: createSubmenu
   *
   * Creates the nodes required to add submenu items inside the given parent
   * item. This is called in <addItem> if a parent item is used for the first
   * time. This adds various DOM nodes and a <submenuImage> to the parent.
   *
   * Parameters:
   *
   * parent - An item returned by <addItem>.
   */
  const createSubmenu = (parent) => {
    const table = parent.setTable(document.createElement('table'));
    table.className = 'mxPopupMenu';

    const tbody = parent.setTbody(document.createElement('tbody'));
    table.appendChild(tbody);

    const div = parent.setDiv(document.createElement('div'));
    div.className = 'mxPopupMenu';

    div.style.position = 'absolute';
    div.style.display = 'inline';
    div.style.zIndex = getZIndex();

    div.appendChild(table);

    const img = document.createElement('img');
    img.setAttribute('src', getSubmenuImage());

    // Last column of the submenu item in the parent menu
    const td = parent.getFirstChild().nextSibling.nextSibling;
    td.appendChild(img);
  };

  /**
   * Function: showSubmenu
   *
   * Shows the submenu inside the given parent row.
   */
  const showSubmenu = (parent, row) => {
    const div = row.getDiv();

    if (isSet(div)) {
      div.style.left =
        parent.getDiv().offsetLeft +
        row.offsetLeft +
        row.offsetWidth -
        1 +
        'px';
      div.style.top = parent.getDiv().offsetTop + row.offsetTop + 'px';
      document.body.appendChild(div);

      // Moves the submenu to the left side if there is no space
      const left = parseInt(div.offsetLeft);
      const width = parseInt(div.offsetWidth);
      const offset = getDocumentScrollOrigin(document);

      const b = document.body;
      const d = document.documentElement;

      const right = offset.getX() + (b.clientWidth || d.clientWidth);

      if (left + width > right) {
        div.style.left =
          Math.max(0, parent.getDiv().offsetLeft - width + -6) + 'px';
      }

      fit(div);
    }
  };

  /**
   * Function: addSeparator
   *
   * Adds a horizontal separator in the given parent item or the top-level menu
   * if no parent is specified.
   *
   * Parameters:
   *
   * parent - Optional item returned by <addItem>.
   * force - Optional boolean to ignore <smartSeparators>. Default is false.
   */
  const addSeparator = (parent = me, force) => {
    if (isSmartSeparators() && !force) {
      parent.setWillAddSeparator(true);
    } else if (isSet(parent.getTbody())) {
      parent.setWillAddSeparator(false);
      const tr = document.createElement('tr');

      const col1 = document.createElement('td');
      col1.className = 'mxPopupMenuIcon';
      col1.style.padding = '0 0 0 0px';

      tr.appendChild(col1);

      const col2 = document.createElement('td');
      col2.style.padding = '0 0 0 0px';
      col2.setAttribute('colSpan', '2');

      const hr = document.createElement('hr');
      hr.setAttribute('size', '1');
      col2.appendChild(hr);

      tr.appendChild(col2);

      parent.getTbody().appendChild(tr);
    }
  };

  /**
   * Function: popup
   *
   * Shows the popup menu for the given event and cell.
   *
   * Example:
   *
   * (code)
   * graph.panningHandler.popup = function(x, y, cell, evt)
   * {
   *   mxUtils.alert('Hello, World!');
   * }
   * (end)
   */
  const popup = (x, y, cell, evt) => {
    const div = getDiv();
    const tbody = getTbody();

    if (isSet(div) && isSet(tbody) && isSet(getFactoryMethod())) {
      div.style.left = x + 'px';
      div.style.top = y + 'px';

      // Removes all child nodes from the existing menu
      while (isSet(tbody.firstChild)) {
        Event.release(tbody.firstChild);
        tbody.removeChild(tbody.firstChild);
      }

      setItemCount(0);
      factoryMethod(me, cell, evt);

      if (getItemCount() > 0) {
        showMenu();
        fireEvent(EventObject(Event.SHOW));
      }
    }
  };

  /**
   * Function: isMenuShowing
   *
   * Returns true if the menu is showing.
   */
  const isMenuShowing = () =>
    isSet(getDiv()) && getDiv().parentNode === document.body;

  /**
   * Function: showMenu
   *
   * Shows the menu.
   */
  const showMenu = () => {
    // Fits the div inside the viewport
    document.body.appendChild(getDiv());
    fit(getDiv());
  };

  /**
   * Function: hideMenu
   *
   * Removes the menu and all submenus.
   */
  const hideMenu = () => {
    const div = getDiv();

    if (isSet(div)) {
      if (isSet(div.parentNode)) {
        div.parentNode.removeChild(div);
      }

      hideSubmenu(me);
      setContainsItems(false);
      fireEvent(EventObject(Event.HIDE));
    }
  };

  /**
   * Function: hideSubmenu
   *
   * Removes all submenus inside the given parent.
   *
   * Parameters:
   *
   * parent - An item returned by <addItem>.
   */
  const hideSubmenu = (parent) => {
    const activeRow = parent.getActiveRow();

    if (isSet(activeRow)) {
      hideSubmenu(activeRow);

      if (isSet(activeRow.getDiv().parentNode)) {
        activeRow.getDiv().parentNode.removeChild(activeRow.getDiv());
      }

      parent.setActiveRow();
    }
  };

  /**
   * Function: destroy
   *
   * Destroys the handler and all its resources and DOM nodes.
   */
  const destroy = () => {
    const div = getDiv();

    if (isSet(div)) {
      Event.release(div);

      if (isSet(div.parentNode)) {
        div.parentNode.removeChild(div);
      }

      setDiv();
    }
  };

  const me = {
    init,
    getDiv,

    /**
     * Function: isEnabled
     *
     * Returns true if events are handled. This implementation
     * returns <enabled>.
     */
    isEnabled,

    /**
     * Function: setEnabled
     *
     * Enables or disables event handling. This implementation
     * updates <enabled>.
     */
    setEnabled,
    isPopupTrigger,
    addItem,
    addCheckmark,
    createSubmenu,
    showSubmenu,
    addSeparator,
    popup,
    isMenuShowing,
    showMenu,
    hideMenu,
    hideSubmenu,
    getActiveRow,
    setActiveRow,
    getDiv,
    getTable,
    getTbody,
    destroy
  };

  const { fireEvent } = EventSource();

  if (isSet(factoryMethod)) {
    init();
  }

  return me;
};

export default PopupMenu;
