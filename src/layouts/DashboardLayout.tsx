import React from "react";
import { Outlet } from "react-router-dom";
import "../styles/app-shell.css";
import { Sidebar } from "../components/shell/Sidebar";
import { BottomNav } from "../components/shell/BottomNav";

// Mise en page persistante (sidebar + bottom nav) pour toutes les pages
// authentifiées : Dashboard, Factures, Clients, Produits, Paiements...
// À utiliser comme route parent dans AppRouter.jsx (voir note ci-dessous).
export default function DashboardLayout() {
  return (
    <div className="ff-app">
      <div className="ff-layout">
        <Sidebar />
        <main className="ff-main">
          <div className="ff-main-inner">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}