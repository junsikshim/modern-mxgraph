import Event from '../util/Event';
import { addProp } from '../Helpers';

const TooltipHandler = (graph, delay = 500) => {
  const [getZIndex, setZIndex] = addProp(10005);
  const [getGraph, setGraph] = addProp(null);
  const [getDelay, setDelay] = addProp(delay);
  const [isIgnoreTouchEvents, setIgnoreTouchEvents] = addProp(true);
  const [isHideOnHover, setIsHideOnHover] = addProp(false);
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

  const getStateForEvent = (evt) => evt.getState();

  const mouseDown = (sender, evt) => {
    resizeTo(evt, false);
    hideTooltip();
  };

  const mouseMove = (sender, evt) => {
    reset(evt, true);
    const state = getStateForEvent(evt);

    if (
      isHideOnHover() ||
      state !== getState() ||
      (evt.getSource() !== getNode() &&
        (!getStateSource() ||
          (state &&
            getStateSource() ==
              (evt.isSource(state.getShape()) ||
                !evt.isSource(state.getState())))))
    ) {
      hideTooltip();
    }

    setLastX(evt.getX());
    setLastY(evt.getY());
  };

  const mouseUp = (sender, evt) => {
    reset(evt, true);
    hideTooltip();
  };

  const resetTimer = () => {
    if (getThread()) {
      window.clearTimeout(getThread());
      setThread(null);
    }
  };

  const reset = (evt, restart, state) => {
    if (!isIgnoreTouchEvents() || Event.isMouseEvent(evt.getEvent())) {
      resetTimer();
    }
  };
};
