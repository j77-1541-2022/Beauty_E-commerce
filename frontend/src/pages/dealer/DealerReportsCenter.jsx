import React, { useState, useEffect } from 'react';
import { BarChart3, AlertTriangle, TrendingUp, Package, DollarSign, Eye } from 'lucide-react';
import { GlassCard, ExportButton } from '../../components/ui/InventoryComponents';
import { ProjectHighlights } from '../../components/ui/ProjectHighlights';
import { dealerAPI } from '../../services/apiClient';

const REPORTS = [
	{
		key: 'inventory-status',
		label: 'Inventory Status',
		icon: Package,
		columns: [
			{ label: 'Product', key: 'product_name' },
			{ label: 'SKU', key: 'sku' },
			{ label: 'Category', key: 'category' },
			{ label: 'Stock', key: 'current_stock' },
			{ label: 'Unit Price', key: 'unit_price' },
			{ label: 'Stock Value', key: 'value_kes' },
		],
	},
	{
		key: 'low-stock',
		label: 'Low Stock',
		icon: AlertTriangle,
		columns: [
			{ label: 'Product', key: 'product_name' },
			{ label: 'SKU', key: 'sku' },
			{ label: 'Category', key: 'category' },
			{ label: 'Stock', key: 'current_stock' },
			{ label: 'Threshold', key: 'reorder_level' },
			{ label: 'Suggested Reorder', key: 'suggested_reorder' },
		],
	},
	{
		key: 'stock-movement',
		label: 'Stock Movement',
		icon: TrendingUp,
		columns: [
			{ label: 'Product', key: 'product_name' },
			{ label: 'Movement Type', key: 'movement_type' },
			{ label: 'Quantity', key: 'quantity' },
			{ label: 'Date', key: 'created_at' },
		],
	},
	{
		key: 'inventory-valuation',
		label: 'Valuation',
		icon: DollarSign,
		columns: [
			{ label: 'Category', key: 'category' },
			{ label: 'Items', key: 'item_count' },
			{ label: 'Stock Value', key: 'total_value_kes' },
			{ label: '% Share', key: 'percentage' },
		],
	},
];

const DealerReportsCenter = () => {
	const [selectedReportKey, setSelectedReportKey] = useState(REPORTS[0].key);
	const [viewedReportKey, setViewedReportKey] = useState(REPORTS[0].key);
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const fetchReport = async (reportKey) => {
		setLoading(true);
		setError(null);
		try {
			let rows = [];
			const key = reportKey;

			if (key === 'inventory-status') {
				const res = await dealerAPI.getInventoryReport();
				rows = res.data?.inventory_data || [];
			}

			if (key === 'low-stock') {
				const res = await dealerAPI.getLowStockReport();
				rows = res.data?.low_stock_data || [];
			}

			if (key === 'stock-movement') {
				const res = await dealerAPI.getStockMovementReport();
				rows = (res.data?.transactions || []).map((item) => ({
					...item,
					product_name: item.dealer_inventory__product__name || 'N/A',
				}));
			}

			if (key === 'inventory-valuation') {
				const res = await dealerAPI.getValuationReport();
				rows = res.data?.category_breakdown || [];
			}

			setData(rows);
		} catch (e) {
			setError('Failed to load report.');
			setData([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchReport(viewedReportKey);
		// eslint-disable-next-line
	}, [viewedReportKey]);

	const report = REPORTS.find((item) => item.key === viewedReportKey) || REPORTS[0];

	const reportTypeForExport = (key) => (
		key === 'inventory-status' ? 'status' :
		key === 'low-stock' ? 'low_stock' :
		key === 'stock-movement' ? 'movement' :
		key === 'inventory-valuation' ? 'valuation' :
		key
	);

	const handleViewReport = () => {
		setViewedReportKey(selectedReportKey);
	};

	return (
		<div className="space-y-6">
			<ProjectHighlights type="inventory" />
			<div className="flex items-center gap-4 mb-2">
				<BarChart3 className="w-7 h-7 text-pink-500" />
				<div>
					<h1 className="text-2xl font-bold">Reports</h1>
					<p className="text-sm text-slate-600">Select, view, and download dealer reports from the system.</p>
				</div>
			</div>
			<GlassCard className="p-4 flex flex-col md:flex-row md:items-end gap-3 bg-slate-900/90 border border-slate-700">
				<div className="flex-1">
					<label htmlFor="report-select" className="block text-sm text-slate-200 mb-2">Choose report</label>
					<select
						id="report-select"
						value={selectedReportKey}
						onChange={(event) => setSelectedReportKey(event.target.value)}
						className="w-full md:max-w-sm px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
					>
						{REPORTS.map((r) => (
							<option key={r.key} value={r.key} className="text-black">
								{r.label}
							</option>
						))}
					</select>
				</div>
				<button
					onClick={handleViewReport}
					className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 border border-pink-500/30 transition-all"
				>
					<Eye size={14} />
					View Report
				</button>
				<ExportButton
					reportType={reportTypeForExport(selectedReportKey)}
					label={`Download ${REPORTS.find((r) => r.key === selectedReportKey)?.label || 'Report'}`}
				/>
			</GlassCard>

			<GlassCard className="p-4">
				<div className="flex items-center justify-between mb-3">
					<h2 className="text-lg font-semibold">All Reports Download Center</h2>
					<span className="text-xs text-slate-600">Download any report directly</span>
				</div>
				<div className="grid gap-2 md:grid-cols-2">
					{REPORTS.map((r) => (
						<div key={r.key} className="flex items-center justify-between rounded-lg border border-white/10 p-3">
							<div className="flex items-center gap-2">
								<r.icon className="w-4 h-4 text-pink-400" />
								<span className="text-sm">{r.label}</span>
							</div>
							<ExportButton reportType={reportTypeForExport(r.key)} label="Download" />
						</div>
					))}
				</div>
			</GlassCard>

			<div className="text-sm text-slate-700">Showing: <span className="font-semibold">{report.label}</span></div>
			<GlassCard className="p-0 overflow-x-auto">
				{loading ? (
					<div className="p-8 text-center text-slate-600">Loading...</div>
				) : error ? (
					<div className="p-8 text-center text-red-400">{error}</div>
				) : (
					<table className="min-w-full text-sm">
						<thead>
							<tr className="bg-gradient-to-r from-pink-600/15 to-purple-600/15 text-pink-900 border-b border-pink-200">
								{report.columns.map((col) => (
									<th key={col.key} className="px-4 py-2 text-left font-semibold">{col.label}</th>
								))}
							</tr>
						</thead>
						<tbody className="text-slate-800">
							{data.length === 0 ? (
								<tr><td colSpan={report.columns.length} className="px-4 py-8 text-center text-slate-600">No data available</td></tr>
							) : (
								data.map((row, i) => (
									<tr key={i} className="border-b border-slate-200 hover:bg-slate-50">
										{report.columns.map((col) => (
											<td key={col.key} className="px-4 py-2 whitespace-nowrap">{row[col.key]}</td>
										))}
									</tr>
								))
							)}
						</tbody>
					</table>
				)}
			</GlassCard>
		</div>
	);
};

export default DealerReportsCenter;