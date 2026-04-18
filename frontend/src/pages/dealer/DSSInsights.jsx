import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, BarChart2, Package, RefreshCw } from 'lucide-react';
import { GlassCard, TabButton, ExportButton } from '../../components/ui/InventoryComponents';
import { ProjectHighlights } from '../../components/ui/ProjectHighlights';
import { dealerAPI } from '../../services/apiClient';

const DSS = [
	{
		key: 'demand-forecast',
		label: 'Demand Forecast',
		icon: TrendingUp,
		columns: [
			{ label: 'Product', key: 'product_name' },
			{ label: 'Date', key: 'date' },
			{ label: 'Forecast', key: 'forecast' },
			{ label: 'Lower', key: 'lower' },
			{ label: 'Upper', key: 'upper' },
		],
	},
	{
		key: 'abc-analysis',
		label: 'ABC Analysis',
		icon: BarChart2,
		columns: [
			{ label: 'Product', key: 'product_name' },
			{ label: 'Class', key: 'classification' },
			{ label: 'Sales Value', key: 'sales_value' },
			{ label: 'Sales Quantity', key: 'sales_quantity' },
			{ label: '% of Total', key: 'percentage_of_total' },
		],
	},
	{
		key: 'eoq-calculator',
		label: 'EOQ Calculator',
		icon: Package,
		columns: [
			{ label: 'Product', key: 'product_name' },
			{ label: 'EOQ', key: 'eoq' },
			{ label: 'Annual Demand', key: 'annual_demand' },
			{ label: 'Reorder Point', key: 'reorder_point' },
			{ label: 'Safety Stock', key: 'safety_stock' },
		],
	},
	{
		key: 'reorder-recommendations',
		label: 'Reorder Recommendations',
		icon: RefreshCw,
		columns: [
			{ label: 'Product', key: 'product_name' },
			{ label: 'Recommended Qty', key: 'suggested_order_quantity' },
			{ label: 'Current Stock', key: 'current_stock' },
			{ label: 'Reorder Level', key: 'reorder_level' },
			{ label: 'Urgency', key: 'urgency' },
		],
	},
];

const DSSInsights = () => {
	const [activeTab, setActiveTab] = useState(0);
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const fetchDSS = async (idx) => {
		setLoading(true);
		setError(null);
		try {
			const reportKey = DSS[idx].key;
			let rows = [];

			if (reportKey === 'abc-analysis') {
				const res = await dealerAPI.getABCAnalysis();
				rows = res.data?.abc_data || [];
			}

			if (reportKey === 'reorder-recommendations') {
				const res = await dealerAPI.getReorderRecommendations();
				rows = res.data?.recommendations || [];
			}

			if (reportKey === 'demand-forecast' || reportKey === 'eoq-calculator') {
				if (reportKey === 'demand-forecast') {
					const res = await dealerAPI.getDemandForecast();
					rows = res.data?.future_forecast || res.data?.rows || [];
				}

				if (reportKey === 'eoq-calculator') {
					const res = await dealerAPI.getEOQ();
					rows = res.data?.eoq_data || (res.data ? [res.data] : []);
				}
			}

			setData(rows);
		} catch (e) {
			setError('Failed to load DSS data.');
			setData([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchDSS(activeTab);
		// eslint-disable-next-line
	}, [activeTab]);

	const dss = DSS[activeTab];

	return (
		<div className="space-y-6 text-slate-900">
			<ProjectHighlights type="dss" />
			<div className="flex items-center gap-4 mb-2">
				<Brain className="w-7 h-7 text-purple-500" />
				<h1 className="text-2xl font-bold text-slate-900">DSS Insights</h1>
			</div>
			<GlassCard className="p-4 flex flex-wrap gap-2 bg-white/90 border border-slate-200 shadow-sm">
				{DSS.map((r, i) => (
					<TabButton key={r.key} active={i === activeTab} onClick={() => setActiveTab(i)} variant="light">
						<r.icon className="w-4 h-4" />
						{r.label}
					</TabButton>
				))}
				<div className="ml-auto">
					<ExportButton reportType={dss.key} label={`Export ${dss.label}`} />
				</div>
			</GlassCard>
			<GlassCard className="p-0 overflow-x-auto bg-white/90 border border-slate-200 shadow-sm">
				{loading ? (
					<div className="p-8 text-center text-slate-500">Loading...</div>
				) : error ? (
					<div className="p-8 text-center text-red-600">{error}</div>
				) : (
					<table className="min-w-full text-sm">
						<thead>
							<tr className="bg-purple-100 text-purple-900">
								{dss.columns.map((col) => (
									<th key={col.key} className="px-4 py-2 text-left font-semibold">{col.label}</th>
								))}
							</tr>
						</thead>
						<tbody className="text-slate-800">
							{data.length === 0 ? (
								<tr><td colSpan={dss.columns.length} className="px-4 py-8 text-center text-slate-500">No data available</td></tr>
							) : (
								data.map((row, i) => (
									<tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
										{dss.columns.map((col) => (
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

export default DSSInsights;