'use client'

import { Shield, Lock, FileText, CheckCircle, ExternalLink, Zap, AlertCircle, ShieldAlert, BookOpen, Terminal, ArrowRight } from 'lucide-react'

export default function SecurityPage() {
    return (
        <div className="min-h-screen bg-background text-foreground p-6 lg:p-12 mb-20 md:mb-0 selection:bg-primary/30">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* Tactical Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900 pb-12">
                    <div>
                        <div className="flex items-center gap-2 text-green-500 font-bold text-xs uppercase tracking-[0.3em] mb-4">
                            <ShieldAlert className="w-4 h-4" />
                            Operational Directives
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter">Safety Protocols</h1>
                        <p className="text-muted-foreground text-lg font-medium mt-2">Core Standard Operating Procedures (SOP) for incident management.</p>
                    </div>
                    <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Global System Integrity: 100% Secure</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Active Guard Status */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                            <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                                <Terminal className="w-6 h-6 text-green-500" />
                                System Defense Grid
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <ProtocolStatus active label="Real-time Tracking" desc="Sub-meter accuracy uplink" />
                                <ProtocolStatus active label="Automated SOS Dispatch" desc="Direct SMS/Email trigger" />
                                <ProtocolStatus active label="Data Sanitization" desc="AES-256 military encryption" />
                                <ProtocolStatus active label="Node Verification" desc="Zero-trust setup handshake" />
                            </div>
                        </div>

                        {/* SOP Cards */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <SOPCard
                                icon={AlertCircle}
                                title="Incident Response Tier 1"
                                content="Immediately verify location via Live Radar. Attempt contact via registered emergency number."
                                color="red"
                            />
                            <SOPCard
                                icon={BookOpen}
                                title="Identity Protection"
                                content="Public scan displays only essential medical & emergency info. Sensitive data remains vault-locked."
                                color="blue"
                            />
                        </div>
                    </div>

                    {/* Quick Access Side Panel */}
                    <div className="space-y-6">
                        <div className="bg-primary/5 border border-primary/20 rounded-[2rem] p-8">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
                                <FileText className="w-5 h-5" />
                                Response ERP
                            </h3>
                            <p className="text-sm text-zinc-400 leading-relaxed mb-8">
                                Detailed Emergency Response Plan PDF contains legal frameworks and escalation matrices for law enforcement.
                            </p>
                            <button className="w-full py-4 bg-primary text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20">
                                Download ERP 2.0
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-8">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-6">Security Compliance</h4>
                            <div className="space-y-4">
                                <ComplianceItem label="GDPR Article 17" status="Compliant" />
                                <ComplianceItem label="SOC 2 Type II" status="Processing" />
                                <ComplianceItem label="ISO 27001" status="Certified" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function ProtocolStatus({ active, label, desc }: any) {
    return (
        <div className="p-5 bg-black/40 border border-zinc-800 rounded-3xl group hover:border-green-500/30 transition-all">
            <div className="flex items-center gap-3 mb-2">
                <CheckCircle className={`w-4 h-4 ${active ? 'text-green-500' : 'text-zinc-600'}`} />
                <span className="font-bold text-white text-sm">{label}</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{desc}</p>
        </div>
    )
}

function SOPCard({ icon: Icon, title, content, color }: any) {
    const colors: any = {
        red: 'border-red-500/20 text-red-500 bg-red-500/5',
        blue: 'border-blue-500/20 text-blue-500 bg-blue-500/5',
    }
    return (
        <div className={`p-8 border rounded-[2rem] ${colors[color]} group hover:bg-opacity-10 transition-all`}>
            <Icon className="w-8 h-8 mb-6" />
            <h4 className="text-white font-black text-lg mb-3 tracking-tight">{title}</h4>
            <p className="text-zinc-400 text-sm leading-relaxed font-medium">{content}</p>
        </div>
    )
}

function ComplianceItem({ label, status }: any) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
            <span className="text-sm font-bold text-zinc-400">{label}</span>
            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${status === 'Compliant' ? 'bg-green-500/10 text-green-500' : status === 'Certified' ? 'bg-primary/10 text-primary' : 'bg-zinc-800 text-zinc-500'}`}>{status}</span>
        </div>
    )
}
