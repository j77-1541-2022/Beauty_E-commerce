import React, { useState, useEffect } from 'react';
import { BarChart3, AlertTriangle, TrendingUp, Package, DollarSign } from 'lucide-react';
import { GlassCard, TabButton, ExportButton } from '../../components/ui/InventoryComponents';
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

const InventoryReports = () => {
	const [activeTab, setActiveTab] = useState(0);
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const fetchReport = async (idx) => {
		setLoading(true);
		setError(null);
		try {
			let rows = [];
			const key = REPORTS[idx].key;

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
		fetchReport(activeTab);
		// eslint-disable-next-line
	}, [activeTab]);

	const report = REPORTS[activeTab];

	return (
		<div className="space-y-6">
			<ProjectHighlights type="inventory" />
			<div className="flex items-center gap-4 mb-2">
				<BarChart3 className="w-7 h-7 text-pink-500" />
				<h1 className="text-2xl font-bold">Inventory Reports</h1>
			</div>
			<GlassCard className="p-4 flex flex-wrap gap-2">
				{REPORTS.map((r, i) => (
					<TabButton key={r.key} active={i === activeTab} onClick={() => setActiveTab(i)}>
						<r.icon className="w-4 h-4" />
						{r.label}
					</TabButton>
				))}
				<div className="ml-auto">
					<ExportButton reportType={
					  report.key === 'inventory-status' ? 'status' :
					  report.key === 'low-stock' ? 'low_stock' :
					  report.key === 'stock-movement' ? 'movement' :
					  report.key === 'inventory-valuation' ? 'valuation' :
					  report.key
					} label={`Export ${report.label}`} />
				</div>
			</GlassCard>
			<GlassCard className="p-0 overflow-x-auto">
				{loading ? (
					<div className="p-8 text-center text-gray-400">Loading...</div>
				) : error ? (
					<div className="p-8 text-center text-red-400">{error}</div>
				) : (
					<table className="min-w-full text-sm">
						<thead>
							<tr className="bg-pink-500/10 text-pink-500">
								{report.columns.map((col) => (
									<th key={col.key} className="px-4 py-2 text-left font-semibold">{col.label}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{data.length === 0 ? (
								<tr><td colSpan={report.columns.length} className="px-4 py-8 text-center text-gray-400">No data available</td></tr>
							) : (
								data.map((row, i) => (
									<tr key={i} className="border-b border-white/10 hover:bg-white/5">
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

export default InventoryReports;