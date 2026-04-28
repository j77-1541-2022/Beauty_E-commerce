import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { dealerAPI } from '../../services/apiClient';

// ── Color constants matching Glow Beyond Beauty theme ──
export const THEME = {
	pink: '#e91e8c',
	purple: '#9c27b0',
	gold: '#ffd700',
	dark: '#1a1a2e',
	glass: 'rgba(255,255,255,0.08)',
};

export const GlassCard = ({ children, className = '', hover = false, onClick }) => (
	<motion.div
		whileHover={hover ? { scale: 1.02 } : {}}
		onClick={onClick}
		className={`backdrop-blur-xl bg-white/8 border border-white/15 rounded-2xl shadow-lg ${className} ${onClick ? 'cursor-pointer' : ''}`}
	>
		{children}
	</motion.div>
);

export const StatCard = ({ label, value, subtitle, icon: Icon, color, trend }) => (
	<GlassCard className="p-5">
		<div className="flex items-start justify-between mb-3">
			<div className={`p-2 rounded-xl`} style={{ background: `${color}22` }}>
				<Icon size={20} style={{ color }} />
			</div>
			{trend && (
				<span className={`text-xs font-medium px-2 py-1 rounded-full ${
					trend === 'up' ? 'bg-green-500/20 text-green-400' :
					trend === 'down' ? 'bg-red-500/20 text-red-400' :
					'bg-gray-500/20 text-gray-400'
				}`}>
					{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
				</span>
			)}
		</div>
		<div className="text-2xl font-bold text-white mb-1">{value}</div>
		<div className="text-sm font-medium text-white/70">{label}</div>
		{subtitle && <div className="text-xs text-white/40 mt-1">{subtitle}</div>}
	</GlassCard>
);

export const TabButton = ({ active, onClick, children, badge, variant = 'dark' }) => (
	<button
		onClick={onClick}
		className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
			variant === 'light'
				? (active
					? 'bg-gradient-to-r from-pink-100 to-purple-100 text-purple-900 border border-purple-200'
					: 'text-slate-700 border border-slate-200 hover:text-slate-900 hover:bg-slate-50')
				: (active
					? 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 text-white border border-pink-500/30'
					: 'text-white/60 hover:text-white hover:bg-white/10')
		}`}
	>
		{children}
		{badge > 0 && (
			<span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
				{badge}
			</span>
		)}
	</button>
);

export const ExportButton = ({ reportType, label }) => {
	const [loading, setLoading] = useState(false);

	const toCsv = (rows) => {
		if (!rows || rows.length === 0) {
			return '';
		}

		const headers = Array.from(
			new Set(rows.flatMap((row) => Object.keys(row || {})))
		);

		const escapeCell = (value) => {
			if (value === null || value === undefined) return '';
			const str = String(value).replace(/"/g, '""');
			return /[",\n]/.test(str) ? `"${str}"` : str;
		};

		const headerLine = headers.join(',');
		const lines = rows.map((row) =>
			headers.map((header) => escapeCell(row?.[header])).join(',')
		);

		return [headerLine, ...lines].join('\n');
	};

	const getRowsForReport = async () => {
		switch (reportType) {
			case 'status': {
				const res = await dealerAPI.getInventoryReport();
				return res.data?.inventory_data || [];
			}
			case 'low_stock': {
				const res = await dealerAPI.getLowStockReport();
				return res.data?.low_stock_data || [];
			}
			case 'movement': {
				const res = await dealerAPI.getStockMovementReport();
				return res.data?.transactions || [];
			}
			case 'valuation': {
				const res = await dealerAPI.getValuationReport();
				return res.data?.category_breakdown || [];
			}
			case 'demand-forecast': {
				const productsRes = await dealerAPI.getProducts();
				const products = Array.isArray(productsRes.data)
					? productsRes.data
					: productsRes.data?.results || [];
				if (!products.length) return [];
				const forecastRes = await dealerAPI.getDemandForecast(products[0].id);
				return forecastRes.data?.future_forecast || [];
			}
			case 'abc-analysis': {
				const res = await dealerAPI.getABCAnalysis();
				return res.data?.abc_data || [];
			}
			case 'eoq-calculator': {
				const eoqRes = await dealerAPI.getEOQ();
				if (Array.isArray(eoqRes.data?.eoq_data)) {
					return eoqRes.data.eoq_data;
				}
				return eoqRes.data ? [eoqRes.data] : [];
			}
			case 'reorder-recommendations': {
				const res = await dealerAPI.getReorderRecommendations();
				return res.data?.recommendations || [];
			}
			default:
				return [];
		}
	};

	const handleExport = async () => {
		setLoading(true);
		try {
			const rows = await getRowsForReport();
			const csv = toCsv(rows);
			if (!csv) {
				console.warn(`No rows available for ${reportType} export.`);
				return;
			}

			const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `glow_${reportType}_report.csv`;
			a.click();
			window.URL.revokeObjectURL(url);
		} catch (e) {
			console.error('Export failed:', e);
		} finally {
			setLoading(false);
		}
	};
	return (
		<button
			onClick={handleExport}
			disabled={loading}
			className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 transition-all"
		>
			<Download size={14} />
			{loading ? 'Exporting...' : label || 'Export CSV'}
		</button>
	);
};
// InventoryComponents.jsx will contain GlassCard, StatCard, TabButton, and ExportButton components for reuse in InventoryReports and DSSInsights pages. Full implementation will follow the provided design. This is a placeholder for the full code, which will be added next.