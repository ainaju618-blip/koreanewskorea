"use client";

import React from 'react';
import { Mail, Upload, FileText, Settings, AlertCircle, CheckCircle } from 'lucide-react';

export default function EmailExtractPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Mail className="w-7 h-7 text-blue-400" />
                        Email Article Extraction
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Extract articles from incoming emails with HWP attachments
                    </p>
                </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <Mail className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Pending Emails</p>
                            <p className="text-2xl font-bold text-white">0</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Extracted Today</p>
                            <p className="text-2xl font-bold text-white">0</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Failed Extractions</p>
                            <p className="text-2xl font-bold text-white">0</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Manual Upload Section */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                        <Upload className="w-5 h-5 text-blue-400" />
                        Manual HWP Upload
                    </h2>

                    <div className="border-2 border-dashed border-[#30363d] rounded-lg p-8 text-center hover:border-blue-500/50 transition-colors cursor-pointer">
                        <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-400 mb-2">Drag and drop HWP files here</p>
                        <p className="text-sm text-gray-500">or click to browse</p>
                        <p className="text-xs text-gray-600 mt-3">
                            Supports: .hwp, .hwpx files
                        </p>
                    </div>

                    <div className="mt-4 p-4 bg-[#0d1117] rounded-lg border border-[#21262d]">
                        <p className="text-sm text-amber-400 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Feature under development
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            HWP extraction requires pyhwp or hwp5 library integration
                        </p>
                    </div>
                </div>

                {/* Email Configuration */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                        <Settings className="w-5 h-5 text-blue-400" />
                        Email Configuration
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Inbound Email Address</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="news@koreanewsone.com"
                                    disabled
                                    className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2 text-gray-300 text-sm disabled:opacity-50"
                                />
                                <button
                                    disabled
                                    className="px-4 py-2 bg-blue-600/50 text-white rounded-lg text-sm disabled:opacity-50"
                                >
                                    Configure
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Email Provider</label>
                            <select
                                disabled
                                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2 text-gray-300 text-sm disabled:opacity-50"
                            >
                                <option>Select provider...</option>
                                <option>SendGrid Inbound Parse</option>
                                <option>Mailgun Routes</option>
                                <option>AWS SES</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Auto-categorize</label>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" disabled className="rounded" />
                                <span className="text-sm text-gray-500">
                                    Automatically categorize articles based on content
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 p-4 bg-[#0d1117] rounded-lg border border-[#21262d]">
                        <p className="text-sm text-amber-400 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Email integration not configured
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Requires SendGrid or Mailgun inbound webhook setup
                        </p>
                    </div>
                </div>
            </div>

            {/* Recent Extractions Table */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Recent Extractions</h2>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#30363d]">
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Source</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Title</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-gray-500">
                                    <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>No email extractions yet</p>
                                    <p className="text-sm mt-1">Extracted articles will appear here</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Implementation Notes */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Implementation Roadmap</h2>

                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">1</div>
                        <div>
                            <p className="text-sm font-medium text-white">Email Inbound Setup</p>
                            <p className="text-xs text-gray-500">Configure SendGrid/Mailgun webhook to receive emails</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">2</div>
                        <div>
                            <p className="text-sm font-medium text-white">HWP Parser Integration</p>
                            <p className="text-xs text-gray-500">Integrate pyhwp or hwp5 library for .hwp file extraction</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">3</div>
                        <div>
                            <p className="text-sm font-medium text-white">Content Processing Pipeline</p>
                            <p className="text-xs text-gray-500">Extract title, content, images from parsed documents</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">4</div>
                        <div>
                            <p className="text-sm font-medium text-white">Draft Creation</p>
                            <p className="text-xs text-gray-500">Auto-create article drafts for editor review</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
