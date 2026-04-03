'use client'

interface TempleSafetyFormProps {
    qrId: string
    onSuccess: () => void
}

export default function TempleSafetyForm({ qrId, onSuccess }: TempleSafetyFormProps) {
    return (
        <div className="p-8 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Temple/Event Safety Form</h2>
            <p className="text-gray-300 mb-4">This form is under development.</p>
            <p className="text-sm text-gray-400">
                Please refer to ChildSafetyForm.tsx or WomenSafetyForm.tsx as templates to create this form.
            </p>
        </div>
    )
}
