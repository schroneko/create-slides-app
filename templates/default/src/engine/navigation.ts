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
  | { type: "SET_TOTAL"; totalSlides: number }
  | { type: "GO_TO"; index: number }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "FIRST" }
  | { type: "LAST" };

interface State {
  currentSlide: number;
  totalSlides: number;
}

function clampSlide(index: number, totalSlides: number): number {
  if (totalSlides <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(index, totalSlides - 1));
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_TOTAL":
      return {
        totalSlides: action.totalSlides,
        currentSlide: clampSlide(state.currentSlide, action.totalSlides),
      };
    case "GO_TO":
      return {
        ...state,
        currentSlide: clampSlide(action.index, state.totalSlides),
      };
    case "NEXT":
      return {
        ...state,
        currentSlide: clampSlide(state.currentSlide + 1, state.totalSlides),
      };
    case "PREV":
      return {
        ...state,
        currentSlide: clampSlide(state.currentSlide - 1, state.totalSlides),
      };
    case "FIRST":
      return { ...state, currentSlide: clampSlide(0, state.totalSlides) };
    case "LAST":
      return {
        ...state,
        currentSlide: clampSlide(state.totalSlides - 1, state.totalSlides),
      };
  }
}

export function useNavigation(totalSlides: number): NavigationState {
  const [state, dispatch] = useReducer(reducer, {
    currentSlide: 0,
    totalSlides,
  });

  useEffect(() => {
    dispatch({ type: "SET_TOTAL", totalSlides });
  }, [totalSlides]);

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
