import React from "react";
import { Header } from "../components/shell/Header";
import { KpiSection } from "../modules/dashboard/components/KpiSection";
import { PerformanceRow } from "../modules/dashboard/components/PerformanceRow";
import { TasksWidget } from "../modules/dashboard/components/TasksWidget";
import { ListsRow } from "../modules/dashboard/components/ListsRow";

export default function Dashboard() {
  return (
    <>
      <Header />
      <KpiSection />
      <PerformanceRow />
      <div style={{ maxWidth: 480 }}>
        <TasksWidget />
      </div>
      <ListsRow />
    </>
  );
}