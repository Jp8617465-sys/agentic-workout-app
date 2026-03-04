import { useState, useCallback, useEffect, useRef } from "react";
import { exerciseRepository } from "./exercise-repository";
import type { Exercise, ExerciseCategory, ExercisePattern } from "../../types";

const DEBOUNCE_MS = 300;

export function useExerciseSearch() {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ExerciseCategory | null>(null);
  const [patternFilter, setPatternFilter] = useState<ExercisePattern | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const performSearch = useCallback(async (
    searchQuery: string,
    category: ExerciseCategory | null,
    pattern: ExercisePattern | null,
  ) => {
    setIsLoading(true);
    try {
      let results: Exercise[];

      if (searchQuery.trim()) {
        results = await exerciseRepository.search(searchQuery);
      } else if (category) {
        results = await exerciseRepository.findByCategory(category);
      } else if (pattern) {
        results = await exerciseRepository.findByPattern(pattern);
      } else {
        results = await exerciseRepository.findAll();
      }

      if (category && searchQuery.trim()) {
        results = results.filter((e) => e.category === category);
      }
      if (pattern) {
        results = results.filter((e) => e.pattern === pattern);
      }

      setExercises(results);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      performSearch(query, categoryFilter, patternFilter);
    }, query ? DEBOUNCE_MS : 0);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, categoryFilter, patternFilter, performSearch]);

  return {
    query,
    setQuery,
    categoryFilter,
    setCategoryFilter,
    patternFilter,
    setPatternFilter,
    exercises,
    isLoading,
  };
}
