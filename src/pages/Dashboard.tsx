import React from "react";
import { Header } from "../components/shell/Header";
import { KpiSection } from "../components/KpiSection";
import { PerformanceRow } from "../components/PerformanceRow";
import { ListsRow } from "../components/ListsRow";

export default function Dashboard() {
  return (
    <>
      <Header />
      <KpiSection />
      <PerformanceRow />
      <ListsRow />
    </>
  );
}