"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const flowData = [
  { name: "Jan", entradas: 12000, saidas: 8000 },
  { name: "Fev", entradas: 15000, saidas: 9500 },
  { name: "Mar", entradas: 14500, saidas: 11000 },
  { name: "Abr", entradas: 18000, saidas: 10500 },
  { name: "Mai", entradas: 16000, saidas: 9000 },
  { name: "Jun", entradas: 19000, saidas: 12000 },
];

const categoryData = [
  { name: "Moradia", value: 3500 },
  { name: "Alimentação", value: 2200 },
  { name: "Transporte", value: 800 },
  { name: "Lazer", value: 1200 },
  { name: "Outros", value: 500 },
];

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#64748b"];

export function FlowChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={flowData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="name" stroke="#64748b" tick={{ fill: "#64748b" }} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" tick={{ fill: "#64748b" }} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value / 1000}k`} />
          <Tooltip 
            contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "8px", color: "#e2e8f0" }}
            itemStyle={{ color: "#e2e8f0" }}
          />
          <Area type="monotone" dataKey="entradas" stroke="#10b981" fillOpacity={1} fill="url(#colorEntradas)" />
          <Area type="monotone" dataKey="saidas" stroke="#ef4444" fillOpacity={1} fill="url(#colorSaidas)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={categoryData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {categoryData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "8px", color: "#e2e8f0" }}
            itemStyle={{ color: "#e2e8f0" }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: "#94a3b8" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
