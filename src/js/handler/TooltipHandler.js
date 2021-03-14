import Event from '../util/Event';
import { addProp, isSet, isUnset } from '../Helpers';
import { fit, getScrollOrigin } from '../util/Utils';
import { TOOLTIP_VERTICAL_OFFSET } from '../util/Constants';

const TooltipHandler = (graph, delay = 500) => {
  const [getZIndex, setZIndex] = addProp(10005);
  const [getGraph, setGraph] = addProp(null);
  const [getDelay, setDelay] = addProp(delay);
  const [isIgnoreTouchEvents, setIgnoreTouchEvents] = addProp(true);
  const [isHideOnHover, setHideOnHover] = addProp(false);
  const [isDestroyed, setDestroyed] = addProp(false);
  const [isEnabled, setEnabled] = addProp(true);
  const [getDiv, setDiv] = addProp(null);
  const [getState, setState] = addProp(null);
  const [getNode, setNode] = addProp(null);
  const [getStateSource, setStateSource] = addProp(null);
  const [getLastX, setLastX] = addProp(null);
  const [getLastY, setLastY] = addProp(null);
  const [getThread, setThread] = addProp(null);

  const init = () => {
    if (!document.body) return;

    const div = document.createElement('div');
    div.className = 'mxTooltip';
    div.style.visibility = 'hidden';
    setDiv(div);

    document.body.appendChild(div);

    Event.addGestureListeners(div, (evt) => {
      const source = Event.getSource(evt);

      if (source.nodeName !== 'A') hideTooltip();
    });
  };

  const getStateForEvent = (mE) => mE.getState();

  const mouseDown = (sender, mE) => {
    resizeTo(mE, false);
    hideTooltip();
  };

  const mouseMove = (sender, mE) => {
    if (mE.getX() !== getLastX() || mE.getY() !== getLastY()) {
      reset(mE, true);
      const state = getStateForEvent(mE);

      if (
        isHideOnHover() ||
        state !== getState() ||
        (mE.getSource() !== getNode() &&
          (!getStateSource() ||
            (isSet(state) &&
              getStateSource() ==
                (mE.isSource(state.getShape()) ||
                  !mE.isSource(state.getText())))))
      ) {
        hideTooltip();
      }
    }

    setLastX(mE.getX());
    setLastY(mE.getY());
  };

  const mouseUp = (sender, mE) => {
    reset(mE, true);
    hideTooltip();
  };

  const resetTimer = () => {
    if (getThread()) {
      window.clearTimeout(getThread());
      setThread(null);
    }
  };

  const reset = (mE, restart, state = getStateForEvent(mE)) => {
    if (!isIgnoreTouchEvents() || Event.isMouseEvent(mE.getEvent())) {
      resetTimer();

      if (
        restart &&
        isEnabled() &&
        isSet(state) &&
        (isUnset(getDiv()) || getDiv().style.visibility === 'hidden')
      ) {
        const node = mE.getSource();
        const x = mE.getX();
        const y = mE.getY();
        const stateSource =
          mE.isSource(state.getShape()) || mE.isSource(state.getText());
        const graph = getGraph();

        setThread(
          window.setTimeout(() => {
            if (
              !graph.isEditing() &&
              !graph.getPopupMenuHandler().isMenuShowing() &&
              !graph.isMouseDown()
            ) {
              // Uses information from inside event cause using the event at
              // this (delayed) point in time is not possible in IE as it no
              // longer contains the required information (member not found)
              const tip = graph.getTooltip(state, node, x, y);
              show(tip, x, y);
              setState(state);
              setNode(node);
              setStateSource(stateSource);
            }
          }, getDelay())
        );
      }
    }
  };

  const hide = () => {
    resetTimer();
    hideTooltip();
  };

  const hideTooltip = () => {
    if (isSet(getDiv())) {
      getDiv().style.visibility = 'hidden';
      getDiv().innerHTML = '';
    }
  };

  const show = (tip, x, y) => {
    if (!isDestroyed() && isSet(tip) && tip.length > 0) {
      const div = getDiv();

      // Initializes the DOM nodes if required
      if (isUnset(div)) {
        init();
      }

      const origin = getScrollOrigin();

      div.style.zIndex = getZIndex();
      div.style.left = x + origin.getX() + 'px';
      div.style.top = y + TOOLTIP_VERTICAL_OFFSET + origin.getY() + 'px';

      if (!isNode(tip)) {
        div.innerHTML = tip.replace(/\n/g, '<br>');
      } else {
        div.innerHTML = '';
        div.appendChild(tip);
      }

      div.style.visibility = '';
      fit(div);
    }
  };

  const destroy = () => {
    const div = getDiv();

    if (!isDestroyed()) {
      getGraph().removeMouseListener(me);
      Event.release(div);

      if (isSet(div) && isSet(div.parentNode)) {
        div.parentNode.removeChild(div);
      }

      setDestroyed(true);
      setDiv();
    }
  };

  const me = {
    isEnabled,
    setEnabled,
    isHideOnHover,
    setHideOnHover,
    init,
    getStateForEvent,
    mouseDown,
    mouseMove,
    mouseUp,
    resetTimer,
    reset,
    hide,
    hideTooltip,
    show,
    getDiv,
    getState,
    destroy
  };

  return me;
};

export default TooltipHandler;
