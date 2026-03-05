import { useReducer, useEffect, useCallback } from "react";

export interface NavigationState {
  currentSlide: number;
  goTo: (index: number) => void;
  next: () => void;
  prev: () => void;
  goToFirst: () => void;
  goToLast: () => void;
}

type Action =
  | { type: "GO_TO"; index: number }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "FIRST" }
  | { type: "LAST" };

interface State {
  currentSlide: number;
  totalSlides: number;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "GO_TO":
      return {
        ...state,
        currentSlide: Math.max(0, Math.min(action.index, state.totalSlides - 1)),
      };
    case "NEXT":
      return {
        ...state,
        currentSlide: Math.min(state.currentSlide + 1, state.totalSlides - 1),
      };
    case "PREV":
      return {
        ...state,
        currentSlide: Math.max(state.currentSlide - 1, 0),
      };
    case "FIRST":
      return { ...state, currentSlide: 0 };
    case "LAST":
      return { ...state, currentSlide: state.totalSlides - 1 };
  }
}

export function useNavigation(totalSlides: number): NavigationState {
  const [state, dispatch] = useReducer(reducer, {
    currentSlide: 0,
    totalSlides,
  });

  const next = useCallback(() => dispatch({ type: "NEXT" }), []);
  const prev = useCallback(() => dispatch({ type: "PREV" }), []);
  const goTo = useCallback((index: number) => dispatch({ type: "GO_TO", index }), []);
  const goToFirst = useCallback(() => dispatch({ type: "FIRST" }), []);
  const goToLast = useCallback(() => dispatch({ type: "LAST" }), []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
        case " ":
          event.preventDefault();
          next();
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "Backspace":
          event.preventDefault();
          prev();
          break;
        case "Home":
          event.preventDefault();
          goToFirst();
          break;
        case "End":
          event.preventDefault();
          goToLast();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [next, prev, goToFirst, goToLast]);

  return { currentSlide: state.currentSlide, goTo, next, prev, goToFirst, goToLast };
}
