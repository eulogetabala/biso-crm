"use client";

import { useState } from "react";

export function usePagination(initialPageSize: number = 20) {
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [currentPage, setCurrentPage] = useState(0);

  return { pageSize, setPageSize, currentPage, setCurrentPage };
}
