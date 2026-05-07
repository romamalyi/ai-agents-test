import { Component, ViewChild, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { BreadcrumbsComponent, Breadcrumb } from '../breadcrumbs/breadcrumbs.component';
import { FeaturesComponent, Feature } from '../features/features.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChatService } from '../../services/chat.service';

interface ChatMessage {
  user: string;
  avatar: string;
  text: string;
  time: string;
  isBot?: boolean;
}

interface Channel {
  name: string;
  id: string;
  messages: ChatMessage[];
  isApp?: boolean;
  autoPopulateLeo?: boolean;
}

interface PlatformData {
  channels: Channel[];
  apps?: Channel[];
}

interface ChannelCommand {
  label: string;
  prompt: string;
  context: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, BreadcrumbsComponent, FeaturesComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewChecked {
  @ViewChild('messagesArea') private messagesArea!: ElementRef;
  private shouldScrollToBottom = false;

  pocTitle = 'Leo AI Chat Assistant';
  pocName = 'Leo AI Assistant';

  breadcrumbs: Breadcrumb[] = [
    { label: 'Home', url: '/' },
    { label: 'PoC', url: '/proof-of-concepts' },
    { label: 'Leo AI Chat Assistant', active: true }
  ];

  features: Feature[] = [
    { icon: '<img src="icons/features/slack-icon.svg" />', title: 'Slack UI Integration' },
    { icon: '<img src="icons/features/ms-teams-icon.svg" />', title: 'MS Teams UI Integration' },
    { icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="#2CA5E0"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>', title: 'Telegram UI Integration' },
    { icon: '<img src="icons/features/summarization-icon.svg" />', title: 'Conversation Summarization' },
    { icon: '<img src="icons/features/corporate-data-icon.svg" />', title: 'Corporate Data Retrieval' },
    { icon: '<img src="icons/features/rag-qna-icon.svg" />', title: 'RAG-Powered Q&A' }
  ];

  industries = [
    { icon: 'icons/industries/fintech.svg', title: 'Financial Services', description: 'AI assistants streamline compliance queries, transaction tracking, and client portfolio summaries across internal communication channels.' },
    { icon: 'icons/industries/healthcare.svg', title: 'Healthcare', description: 'Enable medical teams to quickly access patient records, summarize clinical discussions, and retrieve protocol information via chat.' },
    { icon: 'icons/industries/legaltech.svg', title: 'Legal Industry', description: 'Legal professionals can query case statuses, summarize contract discussions, and access legal knowledge bases directly from Slack or Teams.' },
    { icon: 'icons/industries/edtech.svg', title: 'Education & Research', description: 'Faculty and researchers can query institutional data, summarize meeting notes, and access research databases through familiar chat interfaces.' },
    { icon: 'icons/industries/logistics.svg', title: 'Manufacturing', description: 'Production teams can track order statuses, query ERP data on inventory levels, and get summaries of supply chain discussions.' },
    { icon: 'icons/industries/proptech.svg', title: 'Retail & E-commerce', description: 'Customer support and operations teams can access order data, summarize customer feedback threads, and query product catalogs.' }
  ];

  activeTab: 'slack' | 'teams' | 'telegram' = 'slack';
  activeSection: 'channels' | 'apps' = 'channels';
  activeItemIndex = 0;
  messageInput = '';
  typingChannelId: string | null = null;
  showMentionSuggestion = false;

  private avatarColors: Record<string, string> = {};
  private colorPalette = [
    '#6264A7', '#D13438', '#0078D4', '#107C10', '#CA5010',
    '#8764B8', '#008272', '#4F6BED', '#C239B3', '#567C73',
    '#69797E', '#7A7574', '#E74856', '#0099BC', '#8E562E'
  ];

  channelCommands: Record<string, ChannelCommand[]> = {
    'hr-assistant': [
      { label: 'Check PTO balance', prompt: 'What is my PTO balance and how many days do I have remaining this year?', context: 'PTO policy: 20 PTO days/year, 10 sick days, 5 personal days. Max rollover: 5 days. Check balance at hr.company.com under My Time Off.' },
      { label: 'Benefits enrollment', prompt: 'What benefits are available and when is the enrollment period?', context: 'Benefits: 401(k) with 6% match, health/dental/vision (3 tiers), FSA/HSA. Open enrollment: November 1-15. Life changes allow mid-year enrollment within 30 days.' },
      { label: 'Onboarding process', prompt: 'What does the onboarding process look like for new hires?', context: 'Onboarding: 2-week program. Week 1: IT setup, compliance, HR orientation, buddy. Week 2: team immersion, tools, 30/60/90-day goals. 15 items, avg 8 days.' },
      { label: 'Parental leave policy', prompt: 'What is the parental leave policy?', context: 'Parental leave: 16 weeks primary, 8 weeks secondary. Birth, adoption, foster. 30 days advance notice. Gradual return option available.' },
      { label: 'Learning budget', prompt: 'How does the learning and development budget work?', context: 'Learning: $2,000/year for courses, conferences, certs, books. Pre-approval over $500. Free LinkedIn Learning and Pluralsight. Does not roll over.' }
    ],
    'it-helpdesk': [
      { label: 'VPN troubleshooting', prompt: 'My VPN is not working. How can I fix it?', context: 'VPN: GlobalProtect v5.2. 1) Disconnect/reconnect, 2) Clear DNS, 3) Update to v5.2, 4) Restart, 5) Check MFA. Contact ext. 4357 if persists.' },
      { label: 'Request software', prompt: 'How do I request new software to be installed?', context: 'Software: ServiceNow at servicedesk.company.com. Approved: VS Code, IntelliJ, Slack, Teams, Zoom, 1Password, Docker, Postman. Non-approved: manager + security (5 days).' },
      { label: 'Reset password', prompt: 'How do I reset my password?', context: 'Password: Self-service at identity.company.com (MFA). Locked out: IT ext. 4357 (Mon-Fri 8-6). Min 12 chars, expires 90 days, no reuse of last 10.' },
      { label: 'Report security issue', prompt: 'I think I received a phishing email. What should I do?', context: 'Phishing: 1) No clicks, 2) Forward to security@company.com, 3) Report Phishing button, 4) If clicked: disconnect + call ext. 4400.' },
      { label: 'Printer setup', prompt: 'How do I set up printing in the office?', context: 'Printing: PaperCut follow-me. print.company.com > install > FollowMe queue > badge tap. Color needs manager code. Default: double-sided B&W.' }
    ],
    'sales-insights': [
      { label: 'Pipeline summary', prompt: 'What does our current sales pipeline look like?', context: 'Pipeline: $4.1M, 62% win rate. 23 deals: 8 negotiation $1.8M, 10 proposal $1.5M, 5 discovery $800K. Coverage 3.2x. Weighted $2.54M.' },
      { label: 'Q1 revenue report', prompt: 'What are our Q1 revenue numbers?', context: 'Q1: $2.3M (+12% vs $2.05M target). New $1.4M, Renewals $650K, Upsells $250K. Top: Sarah Chen $890K. ARR $8.2M +34% YoY. Avg deal $125K.' },
      { label: 'Top deals status', prompt: 'What is the status of our top deals?', context: 'Deals: Acme $180K CLOSED, GlobalTech $250K CLOSED, Meridian $450K NEGOTIATION, Pinnacle $320K PROPOSAL, Atlas $200K DISCOVERY.' },
      { label: 'Forecast vs target', prompt: 'How are we tracking against our sales targets?', context: 'Q2: $2.5M target, $1.2M committed (48%), best case $3.1M, coverage 3.2x. Win rate 62% (was 58%). Churn 3.2%.' },
      { label: 'Churn analysis', prompt: 'What does our customer churn look like?', context: 'Churn: 3.2% (industry 5.1%). Lost 4 accounts $180K. Reasons: budget (2), competitor (1), ended (1). At-risk: 3 accounts $420K.' }
    ],
    'project-copilot': [
      { label: 'Sprint status', prompt: 'What is the current sprint status?', context: 'Sprint 14 (Friday). 42 SP committed, 27 done (64%), 8 in progress, 7 remaining. Goal: auth + caching. Avg velocity 38 SP.' },
      { label: 'Open blockers', prompt: 'Are there any current blockers or issues?', context: 'Blockers: 1) Tests 45 min - spike PROJ-234, 2) Payment API vendor wait, 3) Design review Wednesday 2pm. No P1s.' },
      { label: 'Deployment status', prompt: 'What is the latest deployment status?', context: 'v2.4.1 staging Monday. Auth flow + Redis + 3 fixes. QA: 12/18 passed. Prod: Thursday. Azure DevOps CI/CD auto-deploy.' },
      { label: 'Team velocity', prompt: 'What is our team velocity trend?', context: 'Velocity: 35→38→40→42→42. Team: 6 dev, 2 QA, 1 design, 1 PM. 90% capacity. Cycle time 3.2 days.' },
      { label: 'Tech stack info', prompt: 'What is our current tech stack?', context: 'Angular 21 + Tailwind. .NET 9. PostgreSQL 16 + Redis. Azure. CI/CD Azure DevOps. Monitoring: App Insights + Grafana.' }
    ],
    'knowledge-base': [
      { label: 'Architecture docs', prompt: 'Where can I find the architecture decision records?', context: 'ADRs in /docs/architecture. Format ADR-001-title.md. Key: microservices, event-driven, API versioning. Diagrams in Miro.' },
      { label: 'Onboarding checklist', prompt: 'Where is the onboarding checklist for new team members?', context: 'SharePoint > HR > Onboarding. 15 items, 8 days avg. Engineering: wiki.company.com/engineering/onboarding. Buddy 3 months.' },
      { label: 'Engineering standards', prompt: 'What are our engineering standards and coding guidelines?', context: 'wiki.company.com/engineering/standards. 2 approvers, GitFlow, conventional commits, 80% coverage, CI gates.' },
      { label: 'Design system', prompt: 'Where can I find the design system and component library?', context: 'Figma workspace. Components v3.1 at design.company.com. Storybook. @company/design-tokens npm. Brand in SharePoint.' },
      { label: 'Meeting recordings', prompt: 'How do I access meeting recordings and notes?', context: 'Stream, auto-transcribed. Teams > Files or stream.company.com. 90 day retention (permanent for all-hands). Notes in Confluence.' }
    ],
    'executive-brief': [
      { label: 'Q1 KPI summary', prompt: 'Give me a summary of Q1 KPIs.', context: 'Q1: Revenue $2.3M +12%. ARR $8.2M +34%. NPS 72. eNPS 45. Retention 96.8%. Headcount 142. Churn 3.2%. Uptime 99.97%.' },
      { label: 'Revenue forecast', prompt: 'What is the revenue forecast for this fiscal year?', context: 'FY $8.5M. Q1 $2.3M actual. Q2 $2.5M (3.2x). Q3 $2.0M. Q4 $1.7M. Enterprise +45%. Risk: $800K extended. Runway 24mo.' },
      { label: 'Headcount update', prompt: 'What is the current headcount and hiring status?', context: '142 employees. 12 open (5 eng, 3 sales, 2 product, 1 design, 1 HR). 4 offers pending. 42 days avg fill. Attrition 8%.' },
      { label: 'Key risks overview', prompt: 'What are the key business risks right now?', context: 'Risks: $800K deals extended, test bottleneck, 3 at-risk accounts $420K, 2 senior eng unfilled, competitor feature launch.' },
      { label: 'Board meeting prep', prompt: 'What should I prepare for the upcoming board meeting?', context: 'Board Thursday. Q1 deck in SharePoint. CFO financials. Product roadmap v3.0 Q3. Previous: more enterprise + AI ROI data.' }
    ]
  };

  platformData: Record<string, PlatformData> = {
    slack: {
      channels: [
        {
          name: '# hr-assistant',
          id: 'hr-assistant',
          messages: [
            { user: 'Sarah Chen', avatar: 'SC', text: 'Does anyone know how many PTO days we get per year?', time: '9:15 AM' },
            { user: 'Mike Johnson', avatar: 'MJ', text: 'I think it\'s 20 days but I\'m not sure if that includes personal days.', time: '9:22 AM' },
            { user: 'Emily Rodriguez', avatar: 'ER', text: 'What about the new hybrid work policy? I heard it changed recently.', time: '9:30 AM' }
          ]
        },
        {
          name: '# it-helpdesk',
          id: 'it-helpdesk',
          messages: [
            { user: 'David Kim', avatar: 'DK', text: 'My VPN keeps disconnecting every 30 minutes. Anyone else having this issue?', time: '10:00 AM' },
            { user: 'Anna Martinez', avatar: 'AM', text: 'Same here! Started after the latest OS update.', time: '10:12 AM' },
            { user: 'Chris Lee', avatar: 'CL', text: 'IT sent an email about updating the VPN client to v5.2. That might fix it.', time: '10:20 AM' }
          ]
        },
        {
          name: '# sales-insights',
          id: 'sales-insights',
          messages: [
            { user: 'Rachel Kim', avatar: 'RK', text: 'Pipeline update: we closed 3 deals this week totaling $450K!', time: '11:00 AM' },
            { user: 'Brandon Lopez', avatar: 'BL', text: 'Great work team! What\'s the latest on the Meridian account?', time: '11:15 AM' },
            { user: 'Tom Wilson', avatar: 'TW', text: 'Can someone pull the Q1 revenue numbers for the exec meeting?', time: '11:30 AM' }
          ]
        },
        {
          name: '# project-copilot',
          id: 'project-copilot',
          messages: [
            { user: 'Alex Turner', avatar: 'AT', text: 'Sprint 14 is wrapping up Friday. We need to close 5 more tickets.', time: '8:30 AM' },
            { user: 'Nina Patel', avatar: 'NP', text: 'Deployed v2.4.1 to staging yesterday. QA is in progress.', time: '8:45 AM' },
            { user: 'Carlos Rivera', avatar: 'CR', text: 'The integration test bottleneck is still the biggest blocker.', time: '9:00 AM' }
          ]
        },
        {
          name: '# knowledge-base',
          id: 'knowledge-base',
          messages: [
            { user: 'Rebecca Taylor', avatar: 'RT', text: 'Where can I find the architecture decision records?', time: '9:30 AM' },
            { user: 'Peter Novak', avatar: 'PN', text: 'Does anyone have the link to the latest design system docs?', time: '9:45 AM' },
            { user: 'Sophie Grant', avatar: 'SG', text: 'New team members keep asking about the onboarding checklist. Can we pin it?', time: '10:00 AM' }
          ]
        },
        {
          name: '# executive-brief',
          id: 'executive-brief',
          messages: [
            { user: 'Mark Anderson', avatar: 'MA', text: 'Need the Q1 KPI summary for the board meeting next Thursday.', time: '10:30 AM' },
            { user: 'Lisa Park', avatar: 'LP', text: 'Customer NPS jumped to 72 this quarter. Big improvement.', time: '10:45 AM' },
            { user: 'James Wright', avatar: 'JW', text: 'How are we tracking against the FY revenue forecast?', time: '11:00 AM' }
          ]
        }
      ],
      apps: [
        {
          name: 'Leo',
          id: 'leo-dm',
          messages: [],
          isApp: true
        }
      ]
    },
    teams: {
      channels: [
        {
          name: 'Leo',
          isApp: true,
          id: 'leo-assistant',
          messages: []
        },
        {
          name: 'HR Assistant',
          id: 'hr-assistant',
          messages: [
            { user: 'Sarah Chen', avatar: 'SC', text: 'Does anyone know how many PTO days we get per year?', time: '9:15 AM' },
            { user: 'Mike Johnson', avatar: 'MJ', text: 'I think it\'s 20 days but I\'m not sure if that includes personal days.', time: '9:22 AM' },
            { user: 'Emily Rodriguez', avatar: 'ER', text: 'What about the new hybrid work policy? I heard it changed recently.', time: '9:30 AM' }
          ]
        },
        {
          name: 'IT Helpdesk',
          id: 'it-helpdesk',
          messages: [
            { user: 'David Kim', avatar: 'DK', text: 'My VPN keeps disconnecting every 30 minutes. Anyone else having this issue?', time: '10:00 AM' },
            { user: 'Anna Martinez', avatar: 'AM', text: 'Same here! Started after the latest OS update.', time: '10:12 AM' },
            { user: 'Chris Lee', avatar: 'CL', text: 'IT sent an email about updating the VPN client to v5.2. That might fix it.', time: '10:20 AM' }
          ]
        },
        {
          name: 'Sales Insights',
          id: 'sales-insights',
          messages: [
            { user: 'Rachel Kim', avatar: 'RK', text: 'Pipeline update: we closed 3 deals this week totaling $450K!', time: '11:00 AM' },
            { user: 'Brandon Lopez', avatar: 'BL', text: 'Great work team! What\'s the latest on the Meridian account?', time: '11:15 AM' },
            { user: 'Tom Wilson', avatar: 'TW', text: 'Can someone pull the Q1 revenue numbers for the exec meeting?', time: '11:30 AM' }
          ]
        },
        {
          name: 'Project Copilot',
          id: 'project-copilot',
          messages: [
            { user: 'Alex Turner', avatar: 'AT', text: 'Sprint 14 is wrapping up Friday. We need to close 5 more tickets.', time: '8:30 AM' },
            { user: 'Nina Patel', avatar: 'NP', text: 'Deployed v2.4.1 to staging yesterday. QA is in progress.', time: '8:45 AM' },
            { user: 'Carlos Rivera', avatar: 'CR', text: 'The integration test bottleneck is still the biggest blocker.', time: '9:00 AM' }
          ]
        },
        {
          name: 'Knowledge Base',
          id: 'knowledge-base',
          messages: [
            { user: 'Rebecca Taylor', avatar: 'RT', text: 'Where can I find the architecture decision records?', time: '9:30 AM' },
            { user: 'Peter Novak', avatar: 'PN', text: 'Does anyone have the link to the latest design system docs?', time: '9:45 AM' },
            { user: 'Sophie Grant', avatar: 'SG', text: 'New team members keep asking about the onboarding checklist. Can we pin it?', time: '10:00 AM' }
          ]
        },
        {
          name: 'Executive Brief',
          id: 'executive-brief',
          messages: [
            { user: 'Mark Anderson', avatar: 'MA', text: 'Need the Q1 KPI summary for the board meeting next Thursday.', time: '10:30 AM' },
            { user: 'Lisa Park', avatar: 'LP', text: 'Customer NPS jumped to 72 this quarter. Big improvement.', time: '10:45 AM' },
            { user: 'James Wright', avatar: 'JW', text: 'How are we tracking against the FY revenue forecast?', time: '11:00 AM' }
          ]
        }
      ],
      apps: [
        {
          name: 'Leo',
          id: 'leo-dm',
          messages: [],
          isApp: true
        }
      ]
    },
    telegram: {
      channels: [
        {
          name: 'Leo',
          isApp: true,
          id: 'leo-assistant',
          messages: []
        },
        {
          name: 'HR Assistant',
          id: 'hr-assistant',
          messages: [
            { user: 'Sarah Chen', avatar: 'SC', text: 'Does anyone know how many PTO days we get per year?', time: '9:15 AM' },
            { user: 'Mike Johnson', avatar: 'MJ', text: 'I think it\'s 20 days but I\'m not sure if that includes personal days.', time: '9:22 AM' },
            { user: 'Emily Rodriguez', avatar: 'ER', text: 'What about the new hybrid work policy? I heard it changed recently.', time: '9:30 AM' }
          ]
        },
        {
          name: 'IT Helpdesk',
          id: 'it-helpdesk',
          messages: [
            { user: 'David Kim', avatar: 'DK', text: 'My VPN keeps disconnecting every 30 minutes. Anyone else having this issue?', time: '10:00 AM' },
            { user: 'Anna Martinez', avatar: 'AM', text: 'Same here! Started after the latest OS update.', time: '10:12 AM' },
            { user: 'Chris Lee', avatar: 'CL', text: 'IT sent an email about updating the VPN client to v5.2. That might fix it.', time: '10:20 AM' }
          ]
        },
        {
          name: 'Sales Insights',
          id: 'sales-insights',
          messages: [
            { user: 'Rachel Kim', avatar: 'RK', text: 'Pipeline update: we closed 3 deals this week totaling $450K!', time: '11:00 AM' },
            { user: 'Brandon Lopez', avatar: 'BL', text: 'Great work team! What\'s the latest on the Meridian account?', time: '11:15 AM' },
            { user: 'Tom Wilson', avatar: 'TW', text: 'Can someone pull the Q1 revenue numbers for the exec meeting?', time: '11:30 AM' }
          ]
        },
        {
          name: 'Project Copilot',
          id: 'project-copilot',
          messages: [
            { user: 'Alex Turner', avatar: 'AT', text: 'Sprint 14 is wrapping up Friday. We need to close 5 more tickets.', time: '8:30 AM' },
            { user: 'Nina Patel', avatar: 'NP', text: 'Deployed v2.4.1 to staging yesterday. QA is in progress.', time: '8:45 AM' },
            { user: 'Carlos Rivera', avatar: 'CR', text: 'The integration test bottleneck is still the biggest blocker.', time: '9:00 AM' }
          ]
        },
        {
          name: 'Knowledge Base',
          id: 'knowledge-base',
          messages: [
            { user: 'Rebecca Taylor', avatar: 'RT', text: 'Where can I find the architecture decision records?', time: '9:30 AM' },
            { user: 'Peter Novak', avatar: 'PN', text: 'Does anyone have the link to the latest design system docs?', time: '9:45 AM' },
            { user: 'Sophie Grant', avatar: 'SG', text: 'New team members keep asking about the onboarding checklist. Can we pin it?', time: '10:00 AM' }
          ]
        },
        {
          name: 'Executive Brief',
          id: 'executive-brief',
          messages: [
            { user: 'Mark Anderson', avatar: 'MA', text: 'Need the Q1 KPI summary for the board meeting next Thursday.', time: '10:30 AM' },
            { user: 'Lisa Park', avatar: 'LP', text: 'Customer NPS jumped to 72 this quarter. Big improvement.', time: '10:45 AM' },
            { user: 'James Wright', avatar: 'JW', text: 'How are we tracking against the FY revenue forecast?', time: '11:00 AM' }
          ]
        }
      ]
    }
  };

  constructor(private sanitizer: DomSanitizer, private chatService: ChatService) {}

  get currentPlatform(): PlatformData {
    return this.platformData[this.activeTab];
  }

  get currentChannel(): Channel {
    if (this.activeSection === 'apps' && this.currentPlatform.apps) {
      return this.currentPlatform.apps[this.activeItemIndex];
    }
    return this.currentPlatform.channels[this.activeItemIndex];
  }

  get currentCommands(): ChannelCommand[] {
    return this.channelCommands[this.currentChannel.id] || [];
  }

  get isTypingInCurrentChannel(): boolean {
    return this.typingChannelId === this.currentChannel.id;
  }

  switchTab(tab: 'slack' | 'teams' | 'telegram'): void {
    this.activeTab = tab;
    this.activeSection = 'channels';
    this.activeItemIndex = 0;
    this.showMentionSuggestion = false;
  }

  selectChannel(index: number): void {
    this.activeSection = 'channels';
    this.activeItemIndex = index;
    this.showMentionSuggestion = false;
    this.restoreMessageInput();
  }

  selectApp(index: number): void {
    this.activeSection = 'apps';
    this.activeItemIndex = index;
    this.showMentionSuggestion = false;
    this.restoreMessageInput();
  }

  private restoreMessageInput(): void {
    const channel = this.currentChannel;
    if (channel.autoPopulateLeo && !channel.isApp) {
      this.messageInput = '@leo ';
    } else {
      this.messageInput = '';
    }
  }

  getAvatarColor(avatar: string): string {
    if (!this.avatarColors[avatar]) {
      const hash = avatar.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      this.avatarColors[avatar] = this.colorPalette[hash % this.colorPalette.length];
    }
    return this.avatarColors[avatar];
  }

  getTeamsChannelColor(index: number): string {
    const colors = ['#6264A7', '#D13438', '#0078D4', '#107C10'];
    return colors[index % colors.length];
  }

  isTeamsItemActive(index: number): boolean {
    return this.activeSection === 'channels' && this.activeItemIndex === index;
  }

  highlightMentions(text: string): SafeHtml {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const highlighted = escaped
      .replace(/@leo\b/gi, '<span class="mention-leo">@leo</span>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesArea?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    } catch (err) {}
  }

  onMessageInputChange(): void {
    const channel = this.currentChannel;
    if (channel.autoPopulateLeo && !this.messageInput.toLowerCase().includes('@leo')) {
      channel.autoPopulateLeo = false;
    }

    if (!channel.isApp) {
      const input = this.messageInput;
      const atIndex = input.lastIndexOf('@');
      if (atIndex >= 0) {
        const textAfterAt = input.substring(atIndex + 1);
        if (textAfterAt === '' || 'leo'.startsWith(textAfterAt.toLowerCase())) {
          this.showMentionSuggestion = true;
        } else {
          this.showMentionSuggestion = false;
        }
      } else {
        this.showMentionSuggestion = false;
      }
    } else {
      this.showMentionSuggestion = false;
    }
  }

  insertMention(): void {
    const atIndex = this.messageInput.lastIndexOf('@');
    if (atIndex >= 0) {
      this.messageInput = this.messageInput.substring(0, atIndex) + '@leo ';
    } else {
      this.messageInput = '@leo ';
    }
    this.showMentionSuggestion = false;
  }

  selectCommand(cmd: ChannelCommand): void {
    this.showMentionSuggestion = false;
    this.messageInput = '@leo ' + cmd.prompt;
    this.sendMessage(cmd.context);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.mention-suggestion-dropdown') && !target.closest('input')) {
      this.showMentionSuggestion = false;
    }
  }

  sendMessage(context?: string): void {
    const text = this.messageInput.trim();
    if (!text) return;

    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const channel = this.currentChannel;

    channel.messages.push({
      user: 'You',
      avatar: 'YO',
      text,
      time
    });
    this.shouldScrollToBottom = true;

    this.messageInput = '';
    this.showMentionSuggestion = false;

    const hasLeoMention = text.toLowerCase().includes('@leo');
    const shouldCallBot = channel.isApp || hasLeoMention;

    if (hasLeoMention && !channel.isApp) {
      channel.autoPopulateLeo = true;
      this.messageInput = '@leo ';
    }

    if (shouldCallBot) {
      this.typingChannelId = channel.id;

      const cleanedMessage = text.replace(/@leo/gi, '').trim();

      const history = channel.messages
        .filter(m => m.isBot || m.user === 'You')
        .slice(-20)
        .map(m => ({
          role: m.isBot ? 'assistant' as const : 'user' as const,
          content: m.text
        }));

      this.chatService.sendMessage({
        message: cleanedMessage || text,
        channelId: channel.id,
        conversationHistory: history,
        context: context
      }).subscribe({
        next: (response) => {
          this.typingChannelId = null;
          const responseTime = new Date().toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', hour12: true
          });
          channel.messages.push({
            user: 'Leo',
            avatar: 'LE',
            text: response.message,
            time: responseTime,
            isBot: true
          });
          this.shouldScrollToBottom = true;
        },
        error: () => {
          this.typingChannelId = null;
          const responseTime = new Date().toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', hour12: true
          });
          channel.messages.push({
            user: 'Leo',
            avatar: 'LE',
            text: 'Sorry, I encountered an error. Please try again.',
            time: responseTime,
            isBot: true
          });
          this.shouldScrollToBottom = true;
        }
      });
    }
  }
}
