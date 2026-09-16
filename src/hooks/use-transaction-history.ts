import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { fetchTransactionsPage } from "@/lib/transactions.functions";
import type { TransactionRowView } from "@/lib/transactions.server";

export function useTransactionHistory(type: string) {
  const load = useServerFn(fetchTransactionsPage);
  const [rows, setRows] = useState<TransactionRowView[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isPending, setIsPending] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isError, setIsError] = useState(false);

  // reset and refetch page 0 whenever the type filter changes
  useEffect(() => {
    let cancelled = false;
    setIsPending(true);
    setIsError(false);
    setPage(0);
    load({ data: { type, page: 0 } })
      .then((res) => {
        if (cancelled) return;
        setRows(res.rows);
        setHasMore(res.hasMore);
      })
      .catch(() => !cancelled && setIsError(true))
      .finally(() => !cancelled && setIsPending(false));
    return () => {
      cancelled = true;
    };
  }, [type, load]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await load({ data: { type, page: nextPage } });
      setRows((prev) => [...prev, ...res.rows]);
      setHasMore(res.hasMore);
      setPage(nextPage);
    } catch {
      setIsError(true);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, page, type, load]);

  return { rows, isPending, isLoadingMore, isError, hasMore, loadMore };
}
