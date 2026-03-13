import { useReducer, useEffect, useCallback } from "react";

export interface NavigationState {
  currentSlide: number;
  currentFragment: number;
  goTo: (index: number) => void;
  next: () => void;
  prev: () => void;
  goToFirst: () => void;
  goToLast: () => void;
}

type Action =
  | { type: "SET_TOTAL"; totalSlides: number; fragmentCounts: number[] }
  | { type: "GO_TO"; index: number }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "FIRST" }
  | { type: "LAST" };

interface State {
  currentSlide: number;
  currentFragment: number;
  totalSlides: number;
  fragmentCounts: number[];
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
        ...state,
        totalSlides: action.totalSlides,
        fragmentCounts: action.fragmentCounts,
        currentSlide: clampSlide(state.currentSlide, action.totalSlides),
      };
    case "GO_TO":
      return {
        ...state,
        currentSlide: clampSlide(action.index, state.totalSlides),
        currentFragment: 0,
      };
    case "NEXT": {
      const maxFrag = state.fragmentCounts[state.currentSlide] ?? 0;
      if (state.currentFragment < maxFrag) {
        return {
          ...state,
          currentFragment: state.currentFragment + 1,
        };
      }
      const nextSlide = clampSlide(state.currentSlide + 1, state.totalSlides);
      if (nextSlide === state.currentSlide) return state;
      return {
        ...state,
        currentSlide: nextSlide,
        currentFragment: 0,
      };
    }
    case "PREV": {
      if (state.currentFragment > 0) {
        return {
          ...state,
          currentFragment: state.currentFragment - 1,
        };
      }
      const prevSlide = clampSlide(state.currentSlide - 1, state.totalSlides);
      if (prevSlide === state.currentSlide) return state;
      const prevMaxFrag = state.fragmentCounts[prevSlide] ?? 0;
      return {
        ...state,
        currentSlide: prevSlide,
        currentFragment: prevMaxFrag,
      };
    }
    case "FIRST":
      return { ...state, currentSlide: 0, currentFragment: 0 };
    case "LAST": {
      const lastSlide = clampSlide(state.totalSlides - 1, state.totalSlides);
      const lastFrag = state.fragmentCounts[lastSlide] ?? 0;
      return { ...state, currentSlide: lastSlide, currentFragment: lastFrag };
    }
  }
}

export function useNavigation(totalSlides: number, fragmentCounts: number[] = []): NavigationState {
  const [state, dispatch] = useReducer(reducer, {
    currentSlide: 0,
    currentFragment: 0,
    totalSlides,
    fragmentCounts,
  });

  useEffect(() => {
    dispatch({ type: "SET_TOTAL", totalSlides, fragmentCounts });
  }, [totalSlides, fragmentCounts]);

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

  return {
    currentSlide: state.currentSlide,
    currentFragment: state.currentFragment,
    goTo,
    next,
    prev,
    goToFirst,
    goToLast,
  };
}
