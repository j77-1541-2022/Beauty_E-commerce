import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { GlassCard } from './InventoryComponents';

const HIGHLIGHTS = {
	inventory: {
		title: 'Inventory Reports',
		content: [
			'• Get a real-time overview of your stock, low stock alerts, movement, and valuation.',
			'• Export any report as CSV for offline analysis.',
			'• Use these insights to optimize reordering and reduce stockouts.'
		]
	},
	dss: {
		title: 'DSS Insights',
		content: [
			'• Demand Forecast predicts future sales for smarter planning.',
			'• ABC Analysis helps prioritize high-value products.',
			'• EOQ and Reorder Recommendations optimize inventory costs.'
		]
	}
};

export const ProjectHighlights = ({ type = 'inventory' }) => {
	const [open, setOpen] = useState(false);
	const info = HIGHLIGHTS[type] || HIGHLIGHTS.inventory;
	return (
		<GlassCard className="p-4 mb-4">
			<button className="flex items-center gap-2 text-pink-500 font-semibold mb-2" onClick={() => setOpen(o => !o)}>
				<Info className="w-5 h-5" />
				{info.title} Highlights
				{open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
			</button>
			{open && (
				<ul className="text-sm text-gray-700 pl-6 list-disc">
					{info.content.map((line, i) => <li key={i}>{line}</li>)}
				</ul>
			)}
		</GlassCard>
	);
};