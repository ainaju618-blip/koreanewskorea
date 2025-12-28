"use client";

import React from "react";
import { CheckCircle } from "lucide-react";
import { AIProvider, providers } from "../hooks/useAISettings";

interface ProviderSelectorProps {
    selectedProvider: AIProvider;
    onSelect: (provider: AIProvider) => void;
}

export function ProviderSelector({ selectedProvider, onSelect }: ProviderSelectorProps) {
    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">AI 제공자</h3>
            <div className="space-y-2">
                {providers.map(provider => (
                    <button
                        key={provider.id}
                        onClick={() => onSelect(provider.id)}
                        className={`w-full p-3 rounded-lg border-2 transition text-left flex items-center justify-between ${selectedProvider === provider.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                    >
                        <div>
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${provider.color}`}>
                                {provider.name}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">{provider.description}</p>
                        </div>
                        {selectedProvider === provider.id && (
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
