import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, Target, Smartphone, DollarSign, Clock, Zap } from 'lucide-react';

interface InsightCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
}

const insights: InsightCard[] = [
  {
    id: '1',
    title: 'Younger Client Growth',
    description: 'Our under-45 client segment has grown by 8.3% in the last quarter, outpacing the industry average of 3.1%.',
    icon: TrendingUp,
    trend: 'up'
  },
  {
    id: '2',
    title: 'Retention Opportunity',
    description: 'The 46-60 age bracket represents our largest client segment (36%), presenting significant opportunity for long-term retention strategies.',
    icon: Target,
    trend: 'neutral'
  },
  {
    id: '3',
    title: 'Succession Planning',
    description: 'With 25% of clients over 60, we should focus on heir retention strategies to maintain assets through generational transfer.',
    icon: Users,
    trend: 'neutral'
  },
  {
    id: '4',
    title: 'Digital Engagement',
    description: 'Clients under 45 show 3.2x more engagement with our digital platforms than those over 60.',
    icon: Smartphone,
    trend: 'up'
  },
  {
    id: '5',
    title: 'Revenue Impact',
    description: 'Each 5% increase in younger client acquisition correlates with a 12% increase in long-term practice valuation.',
    icon: DollarSign,
    trend: 'up'
  },
  {
    id: '6',
    title: 'Growth Opportunity',
    description: 'Younger clients have longer investment horizons, allowing for more aggressive growth strategies and compound returns over time.',
    icon: Clock,
    trend: 'up'
  },
  {
    id: '7',
    title: 'Technology Adoption',
    description: 'Younger clients are typically more comfortable with digital platforms, making service delivery more efficient and scalable.',
    icon: Zap,
    trend: 'up'
  },
  {
    id: '8',
    title: 'Lifetime Value',
    description: 'Building relationships with younger clients creates decades-long revenue streams as their wealth and needs grow.',
    icon: TrendingUp,
    trend: 'up'
  }
];

export default function PracticeInsightsSidebar() {
  return (
    <div className="w-80 bg-background border-l border-border h-full overflow-y-auto">
      <div className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Practice Insights</h2>
            <p className="text-sm text-muted-foreground mt-1">Strategic Insights</p>
          </div>
          
          <div className="space-y-4">
            {insights.map((insight) => (
              <Card key={insight.id} className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <insight.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground mb-1">
                      {insight.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}