import { redirect } from "next/navigation";
import { parseLabelRange } from "@/lib/label-layout";
import { getRequestBaseUrl } from "@/lib/request-base-url";
import { PrintView } from "./PrintView";

type Props = {
  searchParams: Promise<{ from?: string; to?: string }>;
};

export default async function QrPrintLabelsPage({ searchParams }: Props) {
  const params = await searchParams;
  const range = parseLabelRange(params.from, params.to);

  if (!range) {
    redirect("/admin/qr-print");
  }

  const baseUrl = await getRequestBaseUrl();

  return <PrintView from={range.from} to={range.to} baseUrl={baseUrl} />;
}
