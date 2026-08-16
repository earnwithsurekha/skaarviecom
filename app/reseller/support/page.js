'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  HelpCircle,
  Plus,
  Ticket,
  MessageSquare,
  Phone,
  Mail,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SupportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets', 'faqs', 'contact'
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  
  // Tickets state
  const [tickets, setTickets] = useState([]);
  const [ticketFilter, setTicketFilter] = useState('all');
  const [stats, setStats] = useState({
    total_tickets: 0,
    open_tickets: 0,
    in_progress_tickets: 0,
    resolved_tickets: 0,
    closed_tickets: 0
  });

  // FAQs state
  const [faqs, setFaqs] = useState([]);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [faqSearch, setFaqSearch] = useState('');

  // Ticket form state
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab, ticketFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/');
        return;
      }

      if (activeTab === 'tickets') {
        await Promise.all([fetchTickets(), fetchStats()]);
      } else if (activeTab === 'faqs') {
        await fetchFaqs();
      }

    } catch (error) {
      console.error('Fetch data error:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const statusParam = ticketFilter === 'all' ? '' : `&status=${ticketFilter}`;
      
      const response = await fetch(`/api/reseller/support/tickets?${statusParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.status === 'success') {
        setTickets(data.data.tickets || []);
      }
    } catch (error) {
      console.error('Fetch tickets error:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reseller/support/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.status === 'success') {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const fetchFaqs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reseller/support/faqs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.status === 'success') {
        setFaqs(data.data.faqs || []);
      }
    } catch (error) {
      console.error('Fetch FAQs error:', error);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    
    if (!ticketForm.subject || !ticketForm.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/reseller/support/tickets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ticketForm)
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        toast.success('Ticket created successfully!');
        setShowCreateTicket(false);
        setTicketForm({
          subject: '',
          category: 'general',
          priority: 'medium',
          description: ''
        });
        fetchData();
      } else {
        toast.error(data.message || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('Create ticket error:', error);
      toast.error('Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      open: {
        icon: AlertCircle,
        label: 'Open',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      },
      in_progress: {
        icon: Clock,
        label: 'In Progress',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      },
      resolved: {
        icon: CheckCircle,
        label: 'Resolved',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      },
      closed: {
        icon: XCircle,
        label: 'Closed',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      }
    };
    return configs[status] || configs.open;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-green-600 dark:text-green-400',
      medium: 'text-yellow-600 dark:text-yellow-400',
      high: 'text-orange-600 dark:text-orange-400',
      urgent: 'text-red-600 dark:text-red-400'
    };
    return colors[priority] || colors.medium;
  };

  const filteredFaqs = faqSearch
    ? faqs.filter(faq => 
        faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
        faq.answer.toLowerCase().includes(faqSearch.toLowerCase())
      )
    : faqs;

  if (loading && activeTab !== 'contact') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'rgb(var(--color-primary))' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <HelpCircle className="h-8 w-8" style={{ color: 'rgb(var(--color-primary))' }} />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Support Center
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Get help, raise tickets, and find answers to common questions
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700 w-fit">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-6 py-2.5 rounded-md font-medium transition-all ${
            activeTab === 'tickets'
              ? 'text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          style={activeTab === 'tickets' ? { backgroundColor: 'rgb(var(--color-primary))' } : {}}
        >
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            My Tickets
          </div>
        </button>
        <button
          onClick={() => setActiveTab('faqs')}
          className={`px-6 py-2.5 rounded-md font-medium transition-all ${
            activeTab === 'faqs'
              ? 'text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          style={activeTab === 'faqs' ? { backgroundColor: 'rgb(var(--color-primary))' } : {}}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            FAQs
          </div>
        </button>
        <button
          onClick={() => setActiveTab('contact')}
          className={`px-6 py-2.5 rounded-md font-medium transition-all ${
            activeTab === 'contact'
              ? 'text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          style={activeTab === 'contact' ? { backgroundColor: 'rgb(var(--color-primary))' } : {}}
        >
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact
          </div>
        </button>
      </div>

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_tickets}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 shadow-sm border border-blue-200 dark:border-blue-900/30">
              <p className="text-sm text-blue-700 dark:text-blue-400 mb-1">Open</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.open_tickets}</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 shadow-sm border border-yellow-200 dark:border-yellow-900/30">
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-1">In Progress</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.in_progress_tickets}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 shadow-sm border border-green-200 dark:border-green-900/30">
              <p className="text-sm text-green-700 dark:text-green-400 mb-1">Resolved</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.resolved_tickets}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Closed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.closed_tickets}</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={ticketFilter}
                onChange={(e) => setTicketFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Tickets</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            
            <button
              onClick={() => setShowCreateTicket(!showCreateTicket)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all hover:opacity-90"
              style={{ backgroundColor: 'rgb(var(--color-primary))' }}
            >
              <Plus className="h-5 w-5" />
              Create Ticket
            </button>
          </div>

          {/* Create Ticket Form */}
          {showCreateTicket && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Create New Support Ticket
              </h3>
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ticket-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      id="ticket-category"
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    >
                      <option value="general">General Inquiry</option>
                      <option value="technical">Technical Issue</option>
                      <option value="billing">Billing & Payments</option>
                      <option value="products">Product Related</option>
                      <option value="account">Account Issues</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="ticket-priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priority *
                    </label>
                    <select
                      id="ticket-priority"
                      value={ticketForm.priority}
                      onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="ticket-subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject *
                  </label>
                  <input
                    id="ticket-subject"
                    type="text"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="ticket-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    id="ticket-description"
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Provide detailed information about your issue..."
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: 'rgb(var(--color-primary))' }}
                  >
                    {submitting ? 'Creating...' : 'Submit Ticket'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateTicket(false)}
                    className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white transition-all hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tickets List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your Tickets
              </h2>
            </div>

            {tickets.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {tickets.map((ticket) => {
                  const statusConfig = getStatusConfig(ticket.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <div key={ticket.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono text-sm text-gray-500 dark:text-gray-400">
                              {ticket.ticket_number}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${statusConfig.className}`}>
                              <StatusIcon className="h-3.5 w-3.5" />
                              {statusConfig.label}
                            </span>
                            <span className={`text-xs font-medium uppercase ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {ticket.subject}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                            {ticket.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                            <span>Category: {ticket.category}</span>
                            <span>•</span>
                            <span>{new Date(ticket.created_at).toLocaleString('en-IN')}</span>
                            {ticket.reply_count > 0 && (
                              <>
                                <span>•</span>
                                <span>{ticket.reply_count} {ticket.reply_count === 1 ? 'reply' : 'replies'}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          style={{ backgroundColor: 'rgb(var(--color-primary))', color: 'white' }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Ticket className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Tickets Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create a ticket to get help from our support team
                </p>
                <button
                  onClick={() => setShowCreateTicket(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: 'rgb(var(--color-primary))' }}
                >
                  <Plus className="h-5 w-5" />
                  Create Your First Ticket
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* FAQs Tab */}
      {activeTab === 'faqs' && (
        <>
          {/* Search */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Search FAQs..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* FAQs List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Frequently Asked Questions
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Find answers to common questions
              </p>
            </div>

            {filteredFaqs.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredFaqs.map((faq) => (
                  <div key={faq.id} className="p-6">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                      className="w-full flex items-start justify-between gap-4 text-left"
                    >
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                          {faq.question}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-500 uppercase">
                          {faq.category}
                        </p>
                      </div>
                      {expandedFaq === faq.id ? (
                        <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    
                    {expandedFaq === faq.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No FAQs Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {faqSearch ? 'Try different search terms' : 'FAQs will be added soon'}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Contact Tab */}
      {activeTab === 'contact' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email Support */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-8 border-2 border-blue-200 dark:border-blue-900/30 shadow-md">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-blue-200 dark:bg-blue-900 rounded-full">
                <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Email Support</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Send us an email anytime</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">General Support</p>
                <a href="mailto:support@skaarvi.com" className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                  support@skaarvi.com
                </a>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Reseller Support</p>
                <a href="mailto:reseller@skaarvi.com" className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                  reseller@skaarvi.com
                </a>
              </div>
              <div className="pt-3 border-t border-blue-200 dark:border-blue-900/30">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Average response time: 24-48 hours
                </p>
              </div>
            </div>
          </div>

          {/* Phone Support */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-8 border-2 border-green-200 dark:border-green-900/30 shadow-md">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-green-200 dark:bg-green-900 rounded-full">
                <Phone className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Phone Support</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Talk to our team</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Toll Free</p>
                <a href="tel:1800-xxx-xxxx" className="text-2xl font-bold text-green-600 dark:text-green-400">
                  1800-XXX-XXXX
                </a>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Business Hours</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  Mon - Sat: 9:00 AM - 6:00 PM
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sunday: Closed
                </p>
              </div>
            </div>
          </div>

          {/* WhatsApp Support */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg p-8 border-2 border-emerald-200 dark:border-emerald-900/30 shadow-md">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-emerald-200 dark:bg-emerald-900 rounded-full">
                <Send className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">WhatsApp</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Quick chat support</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Message us on WhatsApp</p>
                <a
                  href="https://wa.me/919xxxxxxxxx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
                >
                  <Send className="h-5 w-5" />
                  Start Chat
                </a>
              </div>
              <div className="pt-3 border-t border-emerald-200 dark:border-emerald-900/30">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Instant support during business hours
                </p>
              </div>
            </div>
          </div>

          {/* Office Address */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-8 border-2 border-purple-200 dark:border-purple-900/30 shadow-md">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-purple-200 dark:bg-purple-900 rounded-full">
                <HelpCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Visit Us</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Our office location</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-base font-semibold text-gray-900 dark:text-white">
                Skaarvi Headquarters
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                123, Business District<br />
                Tech City, State - 500001<br />
                India
              </p>
              <div className="pt-3 border-t border-purple-200 dark:border-purple-900/30">
                <button className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline">
                  Get Directions →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
