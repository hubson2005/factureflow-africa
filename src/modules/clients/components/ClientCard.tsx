import React from "react";
import { Mail, Phone, MapPin, Eye, Edit2 } from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import type { Client, PaletteColor } from "../clients.types";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

function Avatar({ initials, color, size=44 }: { initials:string; color:PaletteColor; size?:number }) {
  const p = palette[color];
  return (
    <div style={{ width:size, height:size, borderRadius:radius.md, background:p[50], color:p.solid,
      display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.3,
      fontWeight:700, flexShrink:0, fontFamily:font }}>{initials}</div>
  );
}

export function ClientCard({ client, onView, onEdit }: {
  client:Client; onView:(id:string)=>void; onEdit:(id:string)=>void;
}) {
  const isActif = client.status === "Actif";
  return (
    <div className="ff-card" style={{ background:colors.white, borderRadius:radius.lg, padding:20,
      border:"1px solid " + colors.gray[100], boxShadow:shadow.card,
      display:"flex", flexDirection:"column", gap:14, marginBottom:12 }}>

      <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
        <Avatar initials={client.initials} color={client.color} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <p style={{ margin:0, fontSize:15, fontWeight:700, color:colors.gray[900] }}>{client.name}</p>
            <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:radius.full,
              background: isActif ? palette.green[50] : colors.gray[100],
              color: isActif ? palette.green.solid : colors.gray[600] }}>{client.status}</span>
          </div>
          <p style={{ margin:"2px 0 0", fontSize:12, color:colors.gray[400] }}>{client.city}</p>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {[
          { icon:Mail, val:client.email },
          { icon:Phone, val:client.phone },
          { icon:MapPin, val:client.city },
        ].map(({ icon:Icon, val }) => (
          <div key={val} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Icon size={13} color={colors.gray[400]} />
            <span style={{ fontSize:13, color:colors.gray[600] }}>{val}</span>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", borderTop:"1px solid " + colors.gray[100], paddingTop:12 }}>
        <div style={{ flex:1, textAlign:"center" }}>
          <p style={{ margin:0, fontSize:16, fontWeight:700, color:colors.gray[900] }}>{client.totalInvoices}</p>
          <p style={{ margin:0, fontSize:11, color:colors.gray[600] }}>Factures</p>
        </div>
        <div style={{ width:1, background:colors.gray[100] }} />
        <div style={{ flex:1, textAlign:"center" }}>
          <p style={{ margin:0, fontSize:13, fontWeight:700, color:colors.gray[900] }}>{client.totalAmount}</p>
          <p style={{ margin:0, fontSize:11, color:colors.gray[600] }}>FCFA total</p>
        </div>
        <div style={{ width:1, background:colors.gray[100] }} />
        <div style={{ flex:1, textAlign:"center" }}>
          <p style={{ margin:0, fontSize:11, fontWeight:600, color:colors.gray[600] }}>Derniere</p>
          <p style={{ margin:0, fontSize:11, color:colors.gray[900] }}>{client.lastInvoice}</p>
        </div>
      </div>

      <div style={{ display:"flex", gap:8 }}>
        <button onClick={()=>onView(client.id)} style={{ flex:1, display:"flex", alignItems:"center",
          justifyContent:"center", gap:6, padding:"9px", borderRadius:radius.md,
          border:"1px solid " + colors.gray[200], background:colors.white,
          fontSize:13, fontWeight:600, color:colors.gray[700], cursor:"pointer", fontFamily:font }}>
          <Eye size={14}/> Voir
        </button>
        <button onClick={()=>onEdit(client.id)} style={{ flex:1, display:"flex", alignItems:"center",
          justifyContent:"center", gap:6, padding:"9px", borderRadius:radius.md, border:"none",
          background:palette.primary.solid, fontSize:13, fontWeight:600, color:colors.white, cursor:"pointer", fontFamily:font }}>
          <Edit2 size={14}/> Modifier
        </button>
      </div>
    </div>
  );
}