'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import toast, { Toaster } from 'react-hot-toast'
import {
    Shield, User, Heart, Phone, Plus, X, Upload, Baby, UserCircle, Car,
    Dog, Key, Package, ArrowLeft, Search, ChevronRight, Camera, Smile,
    Grid, Trash2, Zap, Briefcase, Building2, Lock, Stethoscope, Users,
    AlertTriangle, Flag, HelpCircle, Info, Smartphone, Laptop, Wallet,
    Settings, Loader2, Star, Sparkles, MapPin, CheckCircle2, HandHeart,
    Backpack, Activity, Megaphone, Bike, Truck, Plane, Ship, Bus,
    Flame, Droplets, Wind, ZapOff, Anchor, Award, HardHat,
    Construction, Factory, Microscope, Brain, Music, Coffee, ShoppingBag,
    Navigation, Tent, Monitor, Server, FileText, Download, Siren, Eye, EyeOff,
    CheckSquare, Square, Unlock, ShieldCheck, // ShieldCheck added here
    Edit2
} from 'lucide-react'
import { saveQRProfile } from '@/app/admin/actions'

// ... (Rest of interfaces and constants remain same)

interface UnifiedSafetyFormProps {
    qrId: string
    initialCategory?: string
    initialData?: any
    initialContacts?: any[]
    onSuccess: () => void
}

interface EmergencyContact {
    name: string
    relationship: string
    phone: string
    priority: number
    id?: number
}

interface CustomField {
    label: string
    value: string
    isPrivate: boolean
}

interface DocumentField {
    label: string
    url: string
    fileName: string
    docId?: string
    isPrivate: boolean
}

const PRIMARY_USE_CASES = [
    { id: 'vehicle-safety', name: 'Vehicle Security', desc: 'Owner Contact', icon: Car, color: '#10b981', bg: '#ecfdf5' },
    { id: 'missing-child', name: 'Child Safety', desc: 'Secure ID for Kids', icon: Baby, color: '#3b82f6', bg: '#eff6ff' },
    { id: 'women-safety', name: 'Women Safety', desc: 'Emergency Node', icon: Heart, color: '#8b5cf6', bg: '#f5f3ff' },
    { id: 'accident-emergency', name: 'Accident / SOS', desc: 'Critical Info', icon: AlertTriangle, color: '#ef4444', bg: '#fef2f2' },
    { id: 'mela-safety', name: 'Mela Safety', desc: 'Crowd Protection', icon: ShieldCheck, color: '#6366f1', bg: '#eef2ff' },
    { id: 'pet-recovery', name: 'Pet Discovery', desc: 'Pet ID Tag', icon: Dog, color: '#f59e0b', bg: '#fffbeb' },
    { id: 'emergency-medical', name: 'Medical ID', desc: 'Health Profile', icon: Stethoscope, color: '#f43f5e', bg: '#fff1f2' },
    { id: 'custom-package', name: 'Other Assets', desc: 'Bags & Keys', icon: Settings, color: '#64748b', bg: '#f8fafc' },
]

const TrainTrack = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 17h20" /><path d="M2 7h20" /><path d="M5 2c0 20 0 20 0 20" /><path d="M19 2c0 20 0 20 0 20" /><path d="M5 12h14" /><path d="M5 17h14" /><path d="M5 7h14" /><path d="M5 22h14" /><path d="M5 2h14" /></svg>
)
const DeviceTablet = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><line x1="12" x2="12" y1="18" y2="18" /></svg>
)

const ALL_USE_CASES = [
    {
        group: 'PUBLIC SAFETY & GOVERNMENT', items: [
            { id: 'missing-child', name: 'Missing Child Recovery', icon: Baby },
            { id: 'senior-citizen-lost', name: 'Senior Citizen Tracker', icon: User },
            { id: 'accident-emergency', name: 'Emergency Accident Response', icon: AlertTriangle },
            { id: 'women-safety', name: 'Women Safety Network', icon: Heart },
            { id: 'suspicious-activity', name: 'Suspicious Activity Report', icon: Shield },
            { id: 'fire-hazard', name: 'Fire Hazard Alert', icon: Flame },
            { id: 'natural-disaster', name: 'Disaster Relief Contact', icon: Wind },
            { id: 'flood-emergency', name: 'Flood Rescue ID', icon: Droplets },
            { id: 'missing-person', name: 'General Missing Person', icon: Users },
            { id: 'mela-safety', name: 'Mela Safety / Crowd ID', icon: ShieldCheck },
            { id: 'event-safety', name: 'Event Security Pass', icon: Flag },
            { id: 'civic-issue', name: 'Civic Issue Reporting', icon: Megaphone },
        ]
    },
    {
        group: 'TRANSPORT & VEHICLES', items: [
            { id: 'vehicle-safety', name: 'Vehicle Owner Alert', icon: Car },
            { id: 'wrong-parking', name: 'Wrong Parking Resolver', icon: Info },
            { id: 'bike-recovery', name: 'Bicycle Anti-Theft ID', icon: Bike },
            { id: 'commercial-truck', name: 'Commercial Truck Registry', icon: Truck },
            { id: 'taxi-safety', name: 'Taxi Safety Portal', icon: Shield },
            { id: 'metro-emergency', name: 'Metro Passenger Safety', icon: TrainTrack },
            { id: 'bus-commuter', name: 'Bus Commuter ID', icon: Bus },
            { id: 'scooter-safety', name: 'E-Scooter Security', icon: Zap },
            { id: 'driver-emergency', name: 'Driver Health Profile', icon: Stethoscope },
        ]
    },
    {
        group: 'MEDICAL & HEALTHCARE', items: [
            { id: 'emergency-medical', name: 'Global Medical ID', icon: Stethoscope },
            { id: 'diabetes-alert', name: 'Diabetes Care Protocol', icon: Activity },
            { id: 'heart-patient', name: 'Cardiac Patient Entry', icon: Heart },
            { id: 'blood-donor', name: 'Blood Donor Registry', icon: Droplets },
            { id: 'allergy-protocol', name: 'Severe Allergy Alert', icon: AlertTriangle },
            { id: 'mental-health', name: 'Mental Health Support', icon: Brain },
            { id: 'organ-donor', name: 'Organ Donor Registry', icon: HandHeart },
            { id: 'medicine-remind', name: 'Medicine Retrieval ID', icon: Plus },
            { id: 'pregnancy-care', name: 'Maternal Safety ID', icon: Baby },
        ]
    },
    {
        group: 'PERSONAL ASSETS & GADGETS', items: [
            { id: 'laptop-tag', name: 'Premium Laptop Security', icon: Laptop },
            { id: 'smartphone-recovery', name: 'Smartphone Recovery Tag', icon: Smartphone },
            { id: 'key-recovery', name: 'Smart Key Hub', icon: Key },
            { id: 'wallet-tag', name: 'Smart Wallet Registry', icon: Wallet },
            { id: 'luggage-recovery', name: 'Travel Luggage Finder', icon: Backpack },
            { id: 'camera-secure', name: 'Camera Equipment ID', icon: Camera },
            { id: 'watch-recovery', name: 'Smartwatch Security', icon: Activity },
            { id: 'drone-id', name: 'Commercial Drone ID', icon: Plane },
            { id: 'tablet-security', name: 'Digital Tablet Registry', icon: DeviceTablet },
        ]
    },
    {
        group: 'FAMILY & PET CARE', items: [
            { id: 'pet-id', name: 'Pet Identity Tag', icon: Dog },
            { id: 'toddler-safety', name: 'Toddler Safety Node', icon: Baby },
            { id: 'nanny-emergency', name: 'Nanny Liaison Protocol', icon: Users },
            { id: 'elder-care', name: 'Elder Care Portal', icon: Heart },
            { id: 'home-delivery', name: 'Emergency Delivery Node', icon: Package },
            { id: 'maid-security', name: 'Domestic Help Portal', icon: Briefcase },
        ]
    },
    {
        group: 'SMART CITY & SOCIETY', items: [
            { id: 'society-gate', name: 'Society Gate Access', icon: Building2 },
            { id: 'visitor-id', name: 'Visitor Security Pass', icon: Lock },
            { id: 'gate-parking', name: 'Allocated Parking ID', icon: Car },
            { id: 'flat-owner', name: 'Flat Owner Registry', icon: Building2 },
            { id: 'garbage-mgmt', name: 'Society Waste Alert', icon: Trash2 },
            { id: 'power-outage', name: 'Grid Outage Reporter', icon: ZapOff },
            { id: 'water-leak', name: 'Water Line Reporter', icon: Droplets },
        ]
    },
    {
        group: 'SPORTS & ADVENTURE', items: [
            { id: 'hikers-id', name: 'Wilderness Hiker ID', icon: MapPin },
            { id: 'diver-profile', name: 'Deep Sea Diver ID', icon: Anchor },
            { id: 'athlete-sos', name: 'Pro Athlete SOS', icon: Award },
            { id: 'gym-member', name: 'Gym Member Identity', icon: Activity },
            { id: 'camp-location', name: 'Basecamp Location Node', icon: Tent },
            { id: 'trekking-route', name: 'Trek Route Safety', icon: Navigation },
        ]
    },
    {
        group: 'CORPORATE & OFFICE', items: [
            { id: 'office-id', name: 'Employee Access ID', icon: Briefcase },
            { id: 'server-rack', name: 'IT Infrastructure Tag', icon: Server },
            { id: 'visitor-corporate', name: 'Corporate Guest Pass', icon: UserCircle },
            { id: 'it-asset', name: 'Hardware Asset Tracking', icon: Laptop },
            { id: 'conf-room', name: 'Conference Room Node', icon: Monitor },
        ]
    }
]

const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
    // PUBLIC SAFETY
    'missing-child': ['School Name', 'Class / Section', 'Roll Number', 'Bus Route Number', 'Father Mobile', 'Mother Mobile', 'Class Teacher Name', 'Guardian Name', 'Blood Group', 'Allergies', 'Medication', 'Identifying Marks'],
    'senior-citizen-lost': ['Chronic Illness', 'Primary Medicine', 'Alzheimer Stage', 'Doctor Name', 'Hospital Pref', 'Insurance No', 'Caretaker No', 'Walker / Aid', 'Dietary Restrictions', 'Emergency Contact', 'Pacemaker ID', 'Surgery History'],
    'accident-emergency': ['Blood Group', 'Allergies', 'Insurance Provider', 'Policy Number', 'Emergency Contact 1', 'Emergency Contact 2', 'Medical History', 'Organ Donor ID', 'Hospital Pref', 'Surgeon Contact', 'Next of Kin'],
    'women-safety': ['Primary Guardian', 'Office Location', 'Usual Route', 'Work Address', 'Safe Word', 'Police Station', 'Trusted Neighbor', 'Helpline No', 'Cab Details', 'Live Track Link', 'Close Friend'],
    'suspicious-activity': ['Report Type', 'Location', 'Time Observed', 'Suspect Description', 'Vehicle Details', 'Witness Name', 'Photo Evidence', 'Severity Level', 'Police Notified', 'Contact Info'],
    'fire-hazard': ['Building Name', 'Floor Number', 'Hazard Type', 'Occupancy Count', 'Fire Extinguisher Loc', 'Exit Route', 'Contact Person', 'Gas Line Info', 'Electric Panel Loc', 'Access Code'],
    'natural-disaster': ['Shelter Location', 'Evacuation Route', 'Family Meeting Point', 'Emergency Kit Loc', 'Radio Frequency', 'Blood Group', 'Medicines', 'Special Needs', 'Pet Details', 'Utility Shutoff'],
    'flood-emergency': ['Flood Zone', 'High Ground Loc', 'Boat Availability', 'Life Jackets', 'Family Count', 'Emergency Ration', 'Rescue Signal', 'Medical Needs', 'Power Backup', 'Contact Number'],
    'missing-person': ['Last Seen Loc', 'Clothing Description', 'Height/Weight', 'Hair Color', 'Distinguishing Marks', 'Mental State', 'Phone Number', 'Last Contact', 'Photo URL', 'Police Report No'],
    'civic-issue': ['Issue Type', 'Location Landmark', 'Department', 'Severity', 'Complaint ID', 'Photo Proof', 'Affected Area', 'Reporter Name', 'Date Observed', 'Status'],
    'mela-safety': ['Batch / Group ID', 'Mela Zone', 'Police Picket No.', 'Parent/Leader Mobile', 'Alternate Mobile', 'Home Station', 'Village/City', 'Medical Info', 'Food Habits', 'Lost & Found Center'],
    'event-safety': ['Ticket / Pass ID', 'Seat Range', 'Gate Number', 'Volunteer Name', 'Primary Contact', 'Alternate Contact', 'Medical History', 'Blood Group', 'Allergies', 'Company/Group'],

    // TRANSPORT
    'vehicle-safety': ['Alternate Number / वैकल्पिक नंबर', 'Vehicle Color / वाहन का रंग', 'Driver Name / ड्राइवर का नाम', 'Driver Contact / ड्राइवर संपर्क'],
    'wrong-parking': ['Owner Contact', 'Flat Number', 'Shift Timing', 'Office ID', 'Emergency Move', 'Parking Sticker', 'Vehicle Model', 'Blocking Exit', 'Visitor Pass', 'Residency Status'],
    'bike-recovery': ['Frame Number', 'Color/Model', 'Purchase Date', 'Lock Combination', 'Owner Name', 'Insured Value', 'Theft Insurer', 'Accessories', 'Identifying Sticker', 'Police Report'],
    'commercial-truck': ['Driver Name', 'License Number', 'Cargo Type', 'Route Map', 'Transporter Name', 'Dispatcher No', 'Vehicle Height', 'Load Capacity', 'Permit Valid', 'Insurance No'],
    'taxi-safety': ['Driver Name', 'Badge Number', 'Taxi Permit', 'Owner Contact', 'Night Shift', 'Police Verified', 'Base Stand', 'SOS Button', 'Vehicle Plate', 'Make/Model'],
    'metro-emergency': ['Card Number', 'Daily Route', 'Emergency Contact', 'Medical Condition', 'Disability Info', 'Home Station', 'Work Station', 'Pass Expiry', 'Blood Group', 'Next of Kin'],
    'bus-commuter': ['Pass Number', 'Route Number', 'School/Work', 'Stop Name', 'Emergency Contact', 'Medical Alert', 'Bus Agency', 'Ticket ID', 'Seat Number', 'Travel Time'],
    'scooter-safety': ['Battery ID', 'Charger Loc', 'Helmet Lock', 'Max Speed', 'Owner Name', 'Purchase Bill', 'Warranty Exp', 'Service Center', 'Insurance ID', 'Anti-Theft Code'],
    'driver-emergency': ['License No', 'Blood Group', 'Organ Donor', 'Medical History', 'Vision Correct', 'Allergies', 'Emergency Contact', 'Doctor Name', 'Insurance Co', 'Vehicle Type'],

    // MEDICAL
    'emergency-medical': ['Medical History', 'Current Medication', 'Family Doctor', 'Hospital Pref', 'Blood Type', 'Diabetic Status', 'Pacemaker ID', 'Surgery History', 'Organ Donor', 'Allergy List', 'Insurance ID'],
    'diabetes-alert': ['Insulin Type', 'Dosage Freq', 'Emergency Sugar', 'Pump Brand', 'Doctor Contact', 'Guardian No', 'Last HbA1c', 'Diet Plan', 'Hypo Review', 'Device ID'],
    'heart-patient': ['Cardiologist', 'Stent/Surgery', 'Pacemaker Model', 'Blood Thinners', 'Hospital File', 'Emergency Meds', 'ECG Baseline', 'BP Range', 'Caregiver', 'Ambulance No'],
    'blood-donor': ['Blood Group', 'Last Donation', 'Hemoglobin', 'Disease Hist', 'Donor Card', 'Preferred Hosp', 'Contact No', 'Availability', 'Vaccine Status', 'Antibody Status'],
    'allergy-protocol': ['Allergen List', 'EpiPen Loc', 'Reaction Type', 'Severity', 'Doctor Contact', 'Safe Foods', 'Emergency Meds', 'Asthma Status', 'Guardian', 'Hospital'],
    'mental-health': ['Therapist Name', 'Helpline No', 'Crisis Contact', 'Medication', 'Trigger Warning', 'Safe Space', 'Support Group', 'Diagnosis', 'Preferred Hosp', 'Guardian No'],
    'organ-donor': ['Donor Card No', 'Registered Org', 'Blood Group', 'Family Consent', 'Witness Name', 'Contact No', 'Organs Pledged', 'Doctor Name', 'Hospital', 'Registry Date'],
    'medicine-remind': ['Medicine Name', 'Dosage Mg', 'Time of Day', 'Food Instr', 'Prescribed By', 'Refill Date', 'Pharmacy No', 'Side Effects', 'Storage', 'Purpose'],
    'pregnancy-care': ['Due Date', 'OB/GYN Name', 'Hospital', 'Allergies', 'Blood Group', 'Emergency Contact', 'Birth Plan', 'Partner No', 'Doula Name', 'Medications'],

    // ASSETS
    'laptop-tag': ['Owner Name', 'Employee ID', 'Department', 'System Serial', 'Support Contact', 'Return Address', 'IT Helpdesk', 'Office Floor', 'Manager Name', 'Asset Value', 'Purchase Date'],
    'smartphone-recovery': ['Owner Name', 'Alternate Number', 'IMEI Number', 'Model Name', 'Passcode Hint', 'Cloud ID', 'Emergency Contact', 'Purchase Bill', 'Screen Lock', 'Sim Carrier', 'Warranty'],
    'key-recovery': ['Owner Name', 'Address', 'Reward Amount', 'Contact Number', 'Key Type', 'Locksmith No', 'Spare Key Loc', 'Car Model', 'Gate Code', 'Key Count'],
    'wallet-tag': ['Owner Name', 'Contact No', 'ID Cards Inside', 'Reward if Found', 'Cash Amount', 'Cards Block No', 'Bank Helpline', 'Home Address', 'Alt Contact', 'Warranty'],
    'luggage-recovery': ['Owner Name', 'Flight No', 'Destination', 'Hotel Name', 'Contact Number', 'Email', 'Baggage Tag', 'Airline Name', 'Contents Desc', 'Bag Color', 'Lock Code'],
    'camera-secure': ['Camera Model', 'Serial Number', 'Lens Details', 'Owner Studio', 'Contact No', 'Insurance ID', 'Purchase Date', 'Bag Color', 'Accessory List', 'Reward'],
    'watch-recovery': ['Watch Model', 'Serial Number', 'Purchase Date', 'Warranty ID', 'Owner Name', 'Contact No', 'Strap Color', 'Engraving', 'Value', 'Insurer'],
    'drone-id': ['UIN Number', ' Pilot License', 'Owner Name', 'Contact No', 'Drone Model', 'Weight Class', 'Insurance', 'Flight Log', 'Battery ID', 'Purchase Yr'],
    'tablet-security': ['Model Name', 'Serial Number', 'Owner Name', 'Department', 'Access PIN', 'Case Color', 'Stylus ID', 'Contact No', 'IT Support', 'Warranty'],

    // FAMILY & HOME
    'pet-id': ['Pet Name', 'Breed', 'Age', 'Vet Name', 'Vet Phone', 'Microchip ID', 'Food Habits', 'Aggression Level', 'Owner Address', 'Vaccination Status', 'License No'],
    'toddler-safety': ['Child Name', 'Parent Name', 'Home Address', 'Nanny Contact', 'Pediatrician', 'Allergies', 'School/Daycare', 'Blood Group', 'Favorite Toy', 'Calming Method'],
    'nanny-emergency': ['Nanny Name', 'Agency Name', 'Employer Name', 'Employer No', 'Work Hours', 'Emergency Contact', 'ID Proof', 'Police Verif', 'Allowed Pickups', 'Medical Notes'],
    'elder-care': ['Name', 'Age', 'Conditions', 'Medications', 'Doctor Name', 'Hospital', 'Caretaker', 'Insurance', 'Mobility Aid', 'Dietary Needs', 'DNR Order'],
    'home-delivery': ['Flat Number', 'Gate Code', 'Drop Instruct', 'Guard Name', 'Intercom', 'Landmark', 'Owner No', 'Alternate No', 'Dog Warning', 'Preferred Time'],
    'maid-security': ['Maid Name', 'Agency', 'Mobile No', 'Address', 'ID Card No', 'Police Verif', 'Work Timing', 'Employer Name', 'Exit Pass', 'Emergency No'],
    'society-gate': ['Flat No', 'Owner Name', 'Intercom', 'Vehicle No', 'Parking Slot', 'Tenant Name', 'Move-in Date', 'Family Members', 'Pet Info', 'Frequent Guest'],
    'visitor-id': ['Visitor Name', 'Purpose', 'Host Name', 'Time In', 'Time Out', 'ID Proof', 'Vehicle No', 'Phone No', 'Company', 'Badge No'],
    'gate-parking': ['Slot Number', 'Vehicle No', 'Owner Name', 'Flat No', 'Sticker ID', 'Vehicle Model', 'Contact No', 'Guest Parking', 'Block Level', 'Access Card'],
    'flat-owner': ['Owner Name', 'Designation', 'Company', 'Flat No', 'Email ID', 'Intercom', 'Members Count', 'Parking Slot', 'Tenant Info', 'Maintenance'],
    'garbage-mgmt': ['Flat No', 'Waste Type', 'Collection Time', 'Segregation', 'Fine Status', 'Complaint', 'Staff Name', 'Zone', 'Bin Color', 'Pickup Day'],
    'power-outage': ['Flat No', 'Meter ID', 'Phase Type', 'Backup Status', 'Electrician', 'Complaint ID', 'Appliance', 'Voltage Issue', 'Time Off', 'Restored'],
    'water-leak': ['Flat No', 'Leak Source', 'Severity', 'Plumber Name', 'Shutoff Loc', 'Damage Est', 'Contact No', 'Floor', 'Pipe Type', 'Time Started'],

    // SPORTS
    'hikers-id': ['Hiker Name', 'Blood Group', 'Route Plan', 'Start Date', 'Expected End', 'Emergency No', 'Guide Name', 'Medical Cond', 'Gear Color', 'Satellite Phone'],
    'diver-profile': ['Diver Name', 'Cert Level', 'Dive Shop', 'Insurance', 'Blood Group', 'Allergies', 'Buddy Name', 'Boat Name', 'Max Depth', ' Equip Serial'],
    'athlete-sos': ['Athlete Name', 'Team Name', 'Coach Contact', 'Physio Name', 'Blood Group', 'Injury Hist', 'Insurance', 'Training Loc', 'Event ID', 'Nantl ID'],
    'gym-member': ['Member ID', 'Name', 'Trainer Name', 'Blood Group', 'Emergency No', 'Conditions', 'Goal', 'Join Date', 'Plan Type', 'Locker No'],
    'camp-location': ['Camper Name', 'Tent Color', 'Site Number', 'Group Leader', 'Permit No', 'Check-in', 'Check-out', 'Vehicle No', 'Ranger Station', 'Emergency No'],
    'trekking-route': ['Trek ID', 'Guide Phone', 'Group Size', 'Route Map', 'Checkpoint', 'Start Time', 'Est Arrival', 'Weather', 'Gear List', 'Permit ID'],

    // OFFICE
    'office-id': ['Emp Name', 'Emp ID', 'Dept', 'Manager', 'Work Desk', 'Extension', 'Blood Group', 'Emergency No', 'Laptop ID', 'Access Level'],
    'server-rack': ['Rack ID', 'Server Model', 'IP Range', 'Admin Contact', 'Location', 'UPS ID', 'Cooling Unit', 'Install Date', 'Warranty', 'Maintenance'],
    'visitor-corporate': ['Guest Name', 'Company', 'Host Name', 'Purpose', 'Badge ID', 'Laptop Serial', 'Time In', 'Time Out', 'Escort Name', 'NDA Signed'],
    'it-asset': ['Asset ID', 'Type', 'Model', 'Assigned To', 'Dept', 'Purchase Date', 'Warranty', 'Cost', 'Location', 'Status'],
    'conf-room': ['Room Name', 'Capacity', 'Equipment', 'Floor', 'Admin', 'Extension', 'WiFi Code', 'Booking Sys', 'Projector', 'Polycom'],
}

// Expanded Relationship Options
const RELATIONSHIP_OPTIONS = [
    'Father', 'Mother', 'Spouse', 'Brother', 'Sister', 'Son', 'Daughter',
    'Girlfriend', 'Boyfriend', 'Partner', 'Fiancé', 'Fiancée',
    'Friend', 'Neighbor', 'Doctor', 'Colleague',
    'Grandfather', 'Grandmother', 'Uncle', 'Aunt', 'Cousin',
    'Guardian', 'Caretaker', 'Case Worker', 'Driver', 'Maid'
]

const getCategoryTheme = (catId: string) => {
    const id = catId.toLowerCase();
    if (id.includes('child') || id.includes('toddler') || id.includes('school')) return { primary: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', text: '#1e3a8a' }; // Blue
    if (id.includes('women') || id.includes('maternal')) return { primary: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', text: '#4c1d95' }; // Purple
    if (id.includes('medical') || id.includes('health') || id.includes('blood') || id.includes('diabetes') || id.includes('heart') || id.includes('organ') || id.includes('allergy')) return { primary: '#f43f5e', bg: '#fff1f2', border: '#fecdd3', text: '#881337' }; // Rose
    if (id.includes('senior') || id.includes('elder') || id.includes('dementia')) return { primary: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8', text: '#831843' }; // Pink
    if (id.includes('emergency') || id.includes('accident') || id.includes('fire') || id.includes('disaster') || id.includes('sos')) return { primary: '#ef4444', bg: '#fef2f2', border: '#fecaca', text: '#7f1d1d' }; // Red
    if (id.includes('vehicle') || id.includes('bike') || id.includes('car') || id.includes('truck') || id.includes('scooter') || id.includes('taxi') || id.includes('parking') || id.includes('diver') || id.includes('hiker') || id.includes('trek')) return { primary: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', text: '#064e3b' }; // Emerald
    if (id.includes('pet') || id.includes('dog')) return { primary: '#f59e0b', bg: '#fffbeb', border: '#fde68a', text: '#78350f' }; // Amber
    if (id.includes('corporate') || id.includes('office') || id.includes('server') || id.includes('asset') || id.includes('laptop') || id.includes('tablet') || id.includes('drone') || id.includes('camera')) return { primary: '#64748b', bg: '#f8fafc', border: '#cbd5e1', text: '#0f172a' }; // Slate
    if (id.includes('society') || id.includes('gate') || id.includes('water') || id.includes('power') || id.includes('garbage')) return { primary: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', text: '#0c4a6e' }; // Sky
    if (id.includes('mela') || id.includes('event') || id.includes('festival') || id.includes('fair')) return { primary: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', text: '#312e81' }; // Indigo/Violet
    return { primary: '#0f172a', bg: '#f8fafc', border: '#e2e8f0', text: '#0f172a' };
};

export default function UnifiedSafetyForm({
    qrId,
    initialCategory,
    initialData,
    initialContacts,
    onSuccess
}: UnifiedSafetyFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const pinInputRef = useRef<HTMLInputElement>(null)
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadingDoc, setUploadingDoc] = useState<number | null>(null)
    const [pinError, setPinError] = useState(false)

    // FORCE STEP TO CATEGORY ALWAYS, unless logic strictly demands otherwise
    // If category is already known (Fixed QR), skip selection
    const [step, setStep] = useState(initialCategory ? 'form' : 'category')

    const [category, setCategory] = useState(initialCategory || '')
    const [showExploreModal, setShowExploreModal] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const [formData, setFormData] = useState({
        full_name: initialData?.full_name || '',
        age: initialData?.age?.toString() || '',
        home_address: initialData?.home_address || '',
        pincode: initialData?.additional_data?.pincode || '',
        city: initialData?.additional_data?.city || '',
        state: initialData?.additional_data?.state || '',
        landmark: initialData?.additional_data?.landmark || '',
        emergency_email: initialData?.additional_data?.emergency_email || '',
        is_address_private: initialData?.additional_data?.is_address_private || false,
        photo_url: initialData?.additional_data?.photo_url || '',
        blood_group: initialData?.blood_group || '',
        phone: initialData?.phone || '+91',
        critical_alert: initialData?.additional_data?.critical_alert || '',
        access_pin: initialData?.additional_data?.access_pin || '',
        insurance_expiry: initialData?.additional_data?.insurance_expiry || '',
        puc_expiry: initialData?.additional_data?.puc_expiry || '',
    })

    const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(
        initialContacts && initialContacts.length > 0 ? initialContacts : [
            { name: '', relationship: '', phone: '+91', priority: 1, id: 1 },
            { name: '', relationship: '', phone: '+91', priority: 2, id: 2 },
        ]
    )

    const isPhoneLabel = (label: string) => {
        const l = label.toLowerCase()
        return l.includes('phone') || l.includes('mobile') || l.includes('contact') || l.includes('number') || l.includes('no')
    }

    const [additionalFields, setAdditionalFields] = useState<CustomField[]>(() => {
        if (initialData?.additional_data?.custom_fields) {
            return initialData.additional_data.custom_fields.map((f: any) => ({
                ...f,
                isPrivate: f.isPrivate !== undefined ? f.isPrivate : false
            }))
        }
        if (initialCategory && !initialData) {
            const suggestionsList = CATEGORY_SUGGESTIONS[initialCategory] || []
            return suggestionsList.map((label: string) => ({
                label,
                value: isPhoneLabel(label) ? '+91' : '',
                isPrivate: false
            }))
        }
        return []
    })

    const [documents, setDocuments] = useState<DocumentField[]>(
        initialData?.additional_data?.documents?.map((d: any) => ({
            ...d,
            isPrivate: d.isPrivate !== undefined ? d.isPrivate : false
        })) || []
    )

    const handleCategorySelect = (newCategory: string) => {
        setCategory(newCategory)
        setStep('form')
        // Pre-fill corresponding suggestions automatically if new form
        if (!initialData) {
            const suggestionsList = CATEGORY_SUGGESTIONS[newCategory] || []
            setAdditionalFields(suggestionsList.map((label: string) => ({
                label,
                value: isPhoneLabel(label) ? '+91' : '',
                isPrivate: false
            })))
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 4) // Only 4 digits
        setFormData(prev => ({ ...prev, access_pin: val }))
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return
        setUploading(true)
        try {
            const fileName = `profiles/${qrId}/${Date.now()}_${file.name}`
            const { error: uploadError } = await supabase.storage.from('safety-assets').upload(fileName, file)
            if (uploadError) throw uploadError
            const { data: { publicUrl } } = supabase.storage.from('safety-assets').getPublicUrl(fileName)
            setFormData(prev => ({ ...prev, photo_url: publicUrl }))
            toast.success('Photo Saved')
        } catch (error: any) {
            toast.error('Upload failed')
        } finally {
            setUploading(false)
        }
    }

    const handleContactChange = (index: number, field: string, value: string) => {
        const updated = [...emergencyContacts]
        updated[index] = { ...updated[index], [field]: value }
        setEmergencyContacts(updated)
    }

    const addContact = () => {
        const nextPriority = emergencyContacts.length + 1
        setEmergencyContacts([...emergencyContacts, { name: '', relationship: '', phone: '+91', priority: nextPriority, id: Date.now() }])
    }

    const removeContact = (index: number) => {
        if (emergencyContacts.length <= 1) {
            toast.error('At least 1 Emergency Contact is mandatory')
            return
        }
        const updated = emergencyContacts.filter((_, i) => i !== index)
        // re-rank priorities
        const ranked = updated.map((c, i) => ({ ...c, priority: i + 1 }))
        setEmergencyContacts(ranked)
    }

    const addCustomField = (label: string = '') => setAdditionalFields([...additionalFields, { label: label, value: '', isPrivate: false }])
    const handleFieldChange = (index: number, field: 'label' | 'value' | 'isPrivate', value: any) => {
        const updated = [...additionalFields];
        updated[index] = { ...updated[index], [field]: value };
        setAdditionalFields(updated)
    }
    const removeCustomField = (index: number) => setAdditionalFields(additionalFields.filter((_, i) => i !== index))

    // Document Logic
    const addDocumentField = () => setDocuments([...documents, { label: '', url: '', fileName: '', isPrivate: false }]) // Default false
    const removeDocumentField = (index: number) => setDocuments(documents.filter((_, i) => i !== index))
    const handleDocumentLabelChange = (index: number, field: 'label' | 'docId', val: string) => {
        const updated = [...documents]; updated[index][field] = val; setDocuments(updated)
    }
    const toggleDocumentPrivacy = (index: number) => {
        const updated = [...documents]; updated[index].isPrivate = !updated[index].isPrivate; setDocuments(updated)
    }
    const handleDocumentUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return
        setUploadingDoc(index)
        try {
            const fileName = `docs/${qrId}/${Date.now()}_${file.name}`
            const { error: uploadError } = await supabase.storage.from('safety-assets').upload(fileName, file)
            if (uploadError) throw uploadError
            const { data: { publicUrl } } = supabase.storage.from('safety-assets').getPublicUrl(fileName)
            const updated = [...documents]
            updated[index].url = publicUrl
            updated[index].fileName = file.name
            setDocuments(updated)
            toast.success('Document uploaded')
        } catch (error: any) {
            console.error('Doc Upload Error:', error)
            toast.error(error.message || 'Doc upload failed due to server permissions/settings')
        } finally {
            setUploadingDoc(null)
        }
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.full_name) { toast.error('Name is required'); return }

        // Filter valid contacts - Must have name AND a number longer than just the prefix
        const validContacts = emergencyContacts.filter(c =>
            c.name.trim().length > 0 &&
            c.phone.trim() !== '+91' &&
            c.phone.trim().length > 5
        )

        if (validContacts.length < 1) {
            toast.error('At least 1 Emergency Contact (Name & Correct Phone) is mandatory for safety')
            // Scroll to contacts section for better UX
            const contactsSection = document.getElementById('emergency-contacts-section')
            if (contactsSection) {
                contactsSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
            return
        }

        // NEW VALIDATION: Document must have both image and label
        for (const doc of documents) {
            if (doc.url && !doc.label?.trim()) {
                toast.error("Please enter a 'Doc Name' (ID Name) for the uploaded image.");
                return;
            }
            if (!doc.url && (doc.label?.trim() || doc.docId?.trim())) {
                toast.error(`Please upload the image for "${doc.label || 'the document'}" or remove the entry.`);
                return;
            }
        }

        // Validation: If data is private, PIN is mandatory
        const hasPrivateItems = additionalFields.some(f => f.isPrivate) || documents.some(d => d.isPrivate)
        if (hasPrivateItems && (!formData.access_pin || formData.access_pin.length !== 4)) {
            toast.error('Set a 4-digit PIN to lock private items')
            setPinError(true)
            if (pinInputRef.current) {
                pinInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
                pinInputRef.current.focus()
            }
            return
        }

        setLoading(true)
        try {
            const result = await saveQRProfile({
                qrId,
                category,
                formData,
                additionalFields,
                documents,
                emergencyContacts
            })

            if (!result.success) throw new Error(result.error)

            toast.success(!!initialData ? 'Profile Updated' : 'Activated Successfully')
            onSuccess?.()
        } catch (error: any) {
            console.error('Update Error:', error)
            toast.error(error.message || 'Error updating profile')
        } finally {
            setLoading(false)
        }
    }

    if (step === 'category') {
        const filteredGroups = ALL_USE_CASES.map(group => ({
            ...group,
            items: group.items.filter(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        })).filter(group => group.items.length > 0)

        // Add search capability to also filter PRIMARY_USE_CASES if they match query
        const filteredPrimary = searchQuery
            ? PRIMARY_USE_CASES.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
            : PRIMARY_USE_CASES

        return (
            <div className="min-h-screen bg-[#F0F2F5] p-6 lg:p-12">
                <div className="max-w-5xl mx-auto space-y-8">
                    <div className="text-center space-y-3">
                        <div className="inline-block p-4 bg-white rounded-2xl shadow-sm border border-slate-200 mb-2">
                            <Shield className="w-8 h-8 text-black" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Select Protection Type</h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Choose the category that best fits your needs</p>
                    </div>

                    {!searchQuery && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {PRIMARY_USE_CASES.map((tpl) => (
                                <button
                                    key={tpl.id}
                                    onClick={() => handleCategorySelect(tpl.id)}
                                    className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-black hover:shadow-lg transition-all text-center flex flex-col items-center gap-4 group"
                                >
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform" style={{ backgroundColor: tpl.bg, color: tpl.color }}>
                                        <tpl.icon className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-black text-black uppercase tracking-tight">{tpl.name}</h3>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wide">{tpl.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="text-center pt-4">
                        <button
                            onClick={() => setShowExploreModal(true)}
                            className="bg-black text-white px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2 mx-auto"
                        >
                            <Grid className="w-4 h-4" /> Explore All Categories
                        </button>
                    </div>
                </div>

                {/* Explore Modal */}
                {showExploreModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h2 className="text-lg font-black text-black uppercase tracking-tight">All Categories</h2>
                                <button onClick={() => setShowExploreModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"><X className="w-5 h-5 text-black" /></button>
                            </div>
                            <div className="p-6 border-b border-slate-100 bg-white">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search categories..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-black focus:border-black outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                                {filteredGroups.map((group) => (
                                    <div key={group.group} className="space-y-4">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest sticky top-0 bg-white py-2 z-10">{group.group}</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {group.items.map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => { handleCategorySelect(item.id); setShowExploreModal(false) }}
                                                    className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-xl hover:border-black hover:bg-slate-50 transition-all text-left"
                                                >
                                                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-black border border-slate-100"><item.icon className="w-5 h-5" /></div>
                                                    <span className="font-bold text-black text-xs uppercase tracking-wide">{item.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    const currentTpl = PRIMARY_USE_CASES.find(t => t.id === category) || ALL_USE_CASES.flatMap(g => g.items).find(i => i.id === category)
    const suggestions = CATEGORY_SUGGESTIONS[category] || []

    const isPet = category.includes('pet')
    const isVehicle = category.includes('vehicle') || category.includes('scooter') || category.includes('bike') || category.includes('truck') || category.includes('parking')
    const isAsset = category.includes('laptop') || category.includes('smartphone') || category.includes('key') || category.includes('wallet') || category.includes('luggage') || category.includes('camera') || category.includes('watch') || category.includes('drone') || category.includes('tablet') || category.includes('asset') || category.includes('rack')
    const isProperty = category.includes('gate') || category.includes('flat') || category.includes('room')
    const isChild = category.includes('child') || category.includes('toddler') || category.includes('school') || category.includes('kid')
    const isMedical = category.includes('medical') || category.includes('health') || category.includes('blood') || category.includes('allergy') || category.includes('diabetes') || category.includes('cardiac') || category.includes('patient')

    const coreLabels = {
        fullName: isPet ? 'Pet Name / पालतू का नाम*' : isVehicle ? 'Owner Name / मालिक का नाम*' : isAsset ? 'Owner / Assigned To / मालिक*' : isProperty ? 'Primary Owner Name / मालिक का नाम*' : 'Full Name / पूरा नाम*',
        age: isAsset || isProperty || isVehicle ? 'Model Year / मॉडल वर्ष' : 'Age / उम्र',
        bloodGroup: isAsset || isProperty || isVehicle || isPet ? 'Type / Model / Breed / प्रकार' : 'Blood Group / ब्लड ग्रुप',
        phone: isAsset || isVehicle || isProperty ? 'Primary Contact / संपर्क नंबर' : 'Primary Phone / मोबाइल नंबर',
        photo: isPet ? 'Upload Pet Photo / फोटो डालें' : isVehicle ? 'Upload Vehicle Photo / फोटो डालें' : isProperty ? 'Property Photo / फोटो डालें' : isAsset ? 'Item Photo / फोटो डालें' : 'Upload Photo / फोटो डालें'
    }

    const theme = getCategoryTheme(category);

    return (
        <form onSubmit={handleSubmit} className="min-h-screen bg-[#F0F2F5] p-4 lg:p-8 font-sans text-slate-900 pb-24 transition-colors duration-500">
            <Toaster position="top-center" reverseOrder={false} />
            <div className="max-w-3xl mx-auto space-y-6">

                <div className="flex items-center justify-between pb-4">
                    {!initialCategory ? (
                        <button type="button" onClick={() => setStep('category')} className="px-5 py-2.5 bg-white text-black text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 hover:shadow-md transition-all flex items-center gap-2 shadow-sm">
                            <ArrowLeft className="w-4 h-4" /> Go Back
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-xl border border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <Lock className="w-3 h-3" /> Fixed Purpose
                        </div>
                    )}
                    <div className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest shadow-md">
                        {currentTpl?.name || 'Setup Protocol'}
                    </div>
                </div>

                <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 overflow-hidden ring-1 ring-slate-100">
                    <div className="p-8 flex flex-col items-center gap-6 relative" style={{ backgroundColor: theme.bg }}>
                        <div className="relative group">
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className={`w-36 h-36 rounded-[2rem] bg-white flex flex-col items-center justify-center hover:scale-105 transition-all cursor-pointer group shadow-sm overflow-hidden ${!formData.photo_url ? 'border-2 border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-600' : 'border-4 border-white shadow-md'}`}
                            >
                                {uploading ? (
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                ) : formData.photo_url ? (
                                    <img src={formData.photo_url} className="w-full h-full object-cover" alt="Profile" />
                                ) : (
                                    <>
                                        <Camera className="w-8 h-8 mb-2" />
                                        <div className="flex flex-col items-center gap-0.5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-center px-2 leading-tight">Click to Upload / फोटो डालें</span>
                                            <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-tight">{coreLabels.photo}</span>
                                        </div>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="p-8 sm:p-10 space-y-12">
                        {/* TAILORED DYNAMIC LAYOUTS */}
                        {isChild && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div className="space-y-6">
                                    <SectionHeader icon={Baby} title="Child Identity" theme={theme} />
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                        <FormInput label="Child's Full Name*" name="full_name" value={formData.full_name} onChange={handleInputChange} required />
                                        <FormInput label="Age / Date of Birth" name="age" value={formData.age} onChange={handleInputChange} />
                                        <div className="space-y-1.5 w-full">
                                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider ml-1">Blood Group</label>
                                            <select
                                                name="blood_group"
                                                value={formData.blood_group}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:border-slate-400 outline-none transition-all shadow-sm"
                                            >
                                                <option value="">Select</option>
                                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                                    <option key={bg} value={bg}>{bg}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <GenericInput label="School Name" placeholder="Ex: Delhi Public School" additionalFields={additionalFields} setAdditionalFields={setAdditionalFields} />
                                        <GenericInput label="Class & Section" placeholder="Ex: 5th B" additionalFields={additionalFields} setAdditionalFields={setAdditionalFields} />
                                    </div>
                                    <div className="space-y-1.5 pt-2">
                                        <label className="text-[11px] font-semibold text-red-600 uppercase tracking-wider ml-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Medical Alerts / Needs</label>
                                        <textarea name="critical_alert" value={formData.critical_alert || ''} onChange={handleInputChange} placeholder="Ex: Peanut Allergy, Needs inhaler" rows={2} className="w-full bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm font-medium text-red-900 placeholder:text-red-400 focus:border-red-500 outline-none transition-all resize-none shadow-sm" />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <SectionHeader icon={User} title="Guardian Details" theme={theme} />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <GenericInput label="Father's Name" additionalFields={additionalFields} setAdditionalFields={setAdditionalFields} />
                                        <GenericInput label="Mother's Name" additionalFields={additionalFields} setAdditionalFields={setAdditionalFields} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <FormInput label="Primary Mobile Phone / मोबाइल नंबर" name="phone" value={formData.phone} onChange={handleInputChange} />
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider ml-1 flex items-center justify-between gap-2">
                                                <span>Emergency Email / ईमेल आईडी</span>
                                                <span className="text-[9px] text-amber-600 font-bold lowercase normal-case italic shrink-0">Login & OTP ke liye zaroori</span>
                                            </label>
                                            <FormInput name="emergency_email" type="email" value={formData.emergency_email} onChange={handleInputChange} placeholder="Ex: login@email.com" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isVehicle && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div className="space-y-6">
                                    <SectionHeader icon={Car} title="Vehicle Specification" theme={theme} />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <GenericInput label="Vehicle Model & Make*" placeholder="Ex: Hyundai Creta" additionalFields={additionalFields} setAdditionalFields={setAdditionalFields} />
                                        <GenericInput label="Registration Plate No.*" placeholder="Ex: UP 14 AB 1234" additionalFields={additionalFields} setAdditionalFields={setAdditionalFields} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                        <GenericInput label="Vehicle Color" additionalFields={additionalFields} setAdditionalFields={setAdditionalFields} />
                                        <FormInput label="Fuel Type" name="blood_group" value={formData.blood_group} onChange={handleInputChange} placeholder="EV/Petrol/Diesel" />
                                        <GenericInput label="Chassis No. (Last 4 Digits)" additionalFields={additionalFields} setAdditionalFields={setAdditionalFields} />
                                    </div>
                                    <div className="space-y-1.5 pt-2">
                                        <label className="text-[11px] font-semibold text-red-600 uppercase tracking-wider ml-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Critical Notice / Instructions</label>
                                        <textarea name="critical_alert" value={formData.critical_alert || ''} onChange={handleInputChange} placeholder="Ex: Do not tow, breaks fail if parked wrong" rows={2} className="w-full bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm font-medium text-red-900 placeholder:text-red-400 focus:border-red-500 outline-none transition-all resize-none shadow-sm" />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <SectionHeader icon={Shield} title="Insurance & Security" theme={theme} />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <GenericInput label="Insurance Provider" placeholder="Ex: HDFC Ergo" additionalFields={additionalFields} setAdditionalFields={setAdditionalFields} />
                                        <GenericInput label="Policy Number" placeholder="Ex: POL123456" additionalFields={additionalFields} setAdditionalFields={setAdditionalFields} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <FormInput label="Insurance Expiry Date / इंश्योरेंस समाप्ति तिथि" name="insurance_expiry" type="date" value={formData.insurance_expiry} onChange={handleInputChange} />
                                        <FormInput label="PUC Expiry Date / पीयूसी समाप्ति तिथि" name="puc_expiry" type="date" value={formData.puc_expiry} onChange={handleInputChange} />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <SectionHeader icon={User} title="Owner Profile" theme={theme} />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <FormInput label="Registered Owner Name / मालिक का नाम*" name="full_name" value={formData.full_name} onChange={handleInputChange} required />
                                        <FormInput label="Contact Number / संपर्क नंबर" name="phone" value={formData.phone} onChange={handleInputChange} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider ml-1 flex items-center justify-between gap-2">
                                                <span>Emergency Email / ईमेल आईडी</span>
                                                <span className="text-[9px] text-amber-600 font-bold lowercase normal-case italic shrink-0">Login & OTP ke liye zaroori</span>
                                            </label>
                                            <FormInput name="emergency_email" type="email" value={formData.emergency_email} onChange={handleInputChange} placeholder="Ex: login@email.com" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isPet && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div className="space-y-6">
                                    <SectionHeader icon={Dog} title="Pet Identification" theme={theme} />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <FormInput label="Pet Name*" name="full_name" value={formData.full_name} onChange={handleInputChange} required />
                                        <FormInput label="Breed & Species" name="blood_group" value={formData.blood_group} onChange={handleInputChange} placeholder="Ex: Golden Retriever" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <FormInput label="Age" name="age" value={formData.age} onChange={handleInputChange} placeholder="Ex: 3 Years" />
                                        <GenericInput label="Color / Distinctive Marks" additionalFields={additionalFields} setAdditionalFields={setAdditionalFields} />
                                    </div>
                                    <div className="space-y-1.5 pt-2">
                                        <label className="text-[11px] font-semibold text-red-600 uppercase tracking-wider ml-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Pet Behavior / Medication Needs</label>
                                        <textarea name="critical_alert" value={formData.critical_alert || ''} onChange={handleInputChange} placeholder="Ex: Friendly but gets scared easily. Needs daily medication." rows={2} className="w-full bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm font-medium text-red-900 placeholder:text-red-400 focus:border-red-500 outline-none transition-all resize-none shadow-sm" />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <SectionHeader icon={User} title="Owner & Vet Details" theme={theme} />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <GenericInput label="Owner Name / मालिक का नाम" additionalFields={additionalFields} setAdditionalFields={setAdditionalFields} />
                                        <FormInput label="Contact Number / संपर्क नंबर" name="phone" value={formData.phone} onChange={handleInputChange} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider ml-1 flex items-center justify-between gap-2">
                                                <span>Emergency Email / ईमेल आईडी</span>
                                                <span className="text-[9px] text-amber-600 font-bold lowercase normal-case italic shrink-0">Login & OTP ke liye zaroori</span>
                                            </label>
                                            <FormInput name="emergency_email" type="email" value={formData.emergency_email} onChange={handleInputChange} placeholder="Ex: login@email.com" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <GenericInput label="Veterinary Name" additionalFields={additionalFields} setAdditionalFields={setAdditionalFields} />
                                        <GenericInput label="Veterinary Contact Number" additionalFields={additionalFields} setAdditionalFields={setAdditionalFields} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {isAsset && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div className="space-y-6">
                                    <SectionHeader icon={Settings} title="Item / Asset Specifications" theme={theme} />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <GenericInput label="Item Brand / Make*" placeholder="Ex: Apple MacBook Pro" additionalFields={additionalFields} setAdditionalFields={setAdditionalFields} />
                                        <FormInput label="Model No. / Identifier" name="blood_group" value={formData.blood_group} onChange={handleInputChange} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <GenericInput label="Serial Number (Crucial for Recovery)" additionalFields={additionalFields} setAdditionalFields={setAdditionalFields} />
                                        <FormInput label="Purchase Year / Age" name="age" value={formData.age} onChange={handleInputChange} />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <SectionHeader icon={User} title="Return Authorization" theme={theme} />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <FormInput label="Belongs To (Owner Name) / मालिक का नाम*" name="full_name" value={formData.full_name} onChange={handleInputChange} required />
                                        <FormInput label="Direct Reward / Contact Phone / संपर्क नंबर" name="phone" value={formData.phone} onChange={handleInputChange} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider ml-1 flex items-center justify-between gap-2">
                                                <span>Emergency Email / ईमेल आईडी</span>
                                                <span className="text-[9px] text-amber-600 font-bold lowercase normal-case italic shrink-0">Login & OTP ke liye zaroori</span>
                                            </label>
                                            <FormInput name="emergency_email" type="email" value={formData.emergency_email} onChange={handleInputChange} placeholder="Ex: login@email.com" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 pt-2">
                                        <label className="text-[11px] font-semibold text-red-600 uppercase tracking-wider ml-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Note to Finder</label>
                                        <textarea name="critical_alert" value={formData.critical_alert || ''} onChange={handleInputChange} placeholder="Ex: Contains sensitive work data. Generous cash reward if returned unharmed." rows={2} className="w-full bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm font-medium text-red-900 placeholder:text-red-400 focus:border-red-500 outline-none transition-all resize-none shadow-sm" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {(!isChild && !isVehicle && !isPet && !isAsset) && (
                            <div className="space-y-6 animate-in fade-in duration-500">
                                <SectionHeader icon={User} title={(isMedical ? 'Patient Details' : isProperty ? 'Primary Owner details' : 'Holder Information')} theme={theme} />
                                <div className="grid gap-5">
                                    <FormInput label={coreLabels.fullName} name="full_name" value={formData.full_name} onChange={handleInputChange} required />
                                    <div className="grid grid-cols-2 gap-5">
                                        <FormInput label={coreLabels.age} name="age" value={formData.age} onChange={handleInputChange} />
                                        <FormInput label={coreLabels.bloodGroup} name="blood_group" value={formData.blood_group} onChange={handleInputChange} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <FormInput label={coreLabels.phone} name="phone" value={formData.phone} onChange={handleInputChange} />
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider ml-1 flex items-center justify-between gap-2">
                                                <span>Emergency Email / ईमेल आईडी</span>
                                                <span className="text-[9px] text-amber-600 font-bold lowercase normal-case italic shrink-0">Login & OTP ke liye zaroori</span>
                                            </label>
                                            <FormInput name="emergency_email" type="email" value={formData.emergency_email} onChange={handleInputChange} placeholder="Ex: login@email.com" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 pt-2">
                                        <label className="text-[11px] font-semibold text-red-600 uppercase tracking-wider ml-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Critical Alert / Medical Note</label>
                                        <textarea name="critical_alert" value={formData.critical_alert || ''} onChange={handleInputChange} placeholder="Ex: Severe Peanut Allergy / Diabetic / Needs Instruction" rows={2} className="w-full bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm font-medium text-red-900 placeholder:text-red-400 focus:border-red-500 outline-none transition-all resize-none shadow-sm" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: theme.border }}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl transition-colors duration-500" style={{ backgroundColor: theme.bg, color: theme.primary }}>
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-wider transition-colors duration-500" style={{ color: theme.text }}>Address Details / घर का पता</h3>
                                </div>
                                <div
                                    className={`cursor-pointer px-4 py-2 rounded-xl transition-all flex items-center gap-2.5 shadow-sm border ${formData.is_address_private ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200 group'}`}
                                    onClick={() => setFormData(prev => ({ ...prev, is_address_private: !prev.is_address_private }))}
                                >
                                    {formData.is_address_private ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4 group-hover:text-slate-500" />}
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{formData.is_address_private ? 'Private / छुपा हुआ' : 'Public / सबको दिखेगा'}</span>
                                </div>
                            </div>
                            <div className="grid gap-5">
                                <FormInput label="Full Address / घर का पता" name="home_address" value={formData.home_address} onChange={handleInputChange} placeholder="House No, Street, Locality" isTextArea />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <FormInput label="Landmark / लैंडमार्क" name="landmark" value={formData.landmark} onChange={handleInputChange} placeholder="Ex: Near School" />
                                    <FormInput label="City / शहर" name="city" value={formData.city} onChange={handleInputChange} placeholder="Ex: New Delhi" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <FormInput label="State / राज्य" name="state" value={formData.state} onChange={handleInputChange} placeholder="Ex: Delhi" />
                                    <FormInput label="Pincode / पिनकोड" name="pincode" value={formData.pincode} onChange={handleInputChange} placeholder="Ex: 110001" />
                                </div>
                            </div>
                        </div>

                        {/* Section 2 */}
                        <div className="space-y-6" id="emergency-contacts-section">
                            <SectionHeader icon={Phone} title="Emergency Contacts" theme={theme} />
                            <div className="grid gap-4">
                                {emergencyContacts.map((contact, idx) => (
                                    <div key={contact.id} className="p-5 rounded-2xl border space-y-4 relative group transition-colors duration-500" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guardian {idx + 1}</span>
                                            <div className="flex items-center gap-2">
                                                {idx === 0 && <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">Primary</span>}
                                                {/* Delete Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => removeContact(idx)}
                                                    className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                                    title="Remove Contact"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            <div className="col-span-2 sm:col-span-1">
                                                <SimpleIn placeholder="Guardian Name" value={contact.name} onChange={(v: string) => handleContactChange(idx, 'name', v)} />
                                            </div>
                                            <div className="col-span-1 sm:col-span-1">
                                                <SimpleIn placeholder="Mobile Number" value={contact.phone} onChange={(v: string) => handleContactChange(idx, 'phone', v)} />
                                            </div>
                                            <div className="col-span-1 sm:col-span-1">
                                                {contact.relationship === 'Other' || contact.relationship.startsWith('Custom:') ? (
                                                    <SimpleIn
                                                        placeholder="Type Relation..."
                                                        value={contact.relationship.replace('Custom:', '')}
                                                        onChange={(v: string) => handleContactChange(idx, 'relationship', v)}
                                                    />
                                                ) : (
                                                    <SelectIn
                                                        options={RELATIONSHIP_OPTIONS}
                                                        value={contact.relationship}
                                                        onChange={(v: string) => handleContactChange(idx, 'relationship', v)}
                                                        placeholder="Relation"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={addContact}
                                className="w-full py-4 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest shadow-sm transition-all text-white hover:opacity-90 mt-4"
                                style={{ backgroundColor: theme.primary, borderColor: theme.primary }}
                            >
                                <Plus className="w-4 h-4" /> Add Emergency Contact
                            </button>
                        </div>

                        {/* Section 3 - Category Specific Details ONLY If any exist that we haven't rendered directly */}
                        {/* Section 3 - Category Specific Details ONLY If any exist that we haven't rendered directly */}
                        {(() => {
                            const renderedLabels: Record<string, boolean> = {
                                "school name": true, "class & section": true, "father's name": true, "mother's name": true,
                                "vehicle model & make*": true, "registration plate no.*": true, "vehicle color": true, "chassis no. (last 4 digits)": true,
                                "color / distinctive marks": true, "owner name": true, "veterinary name": true, "veterinary contact": true, "veterinary contact number": true,
                                "item brand / make*": true, "serial number (crucial for recovery)": true,
                                "blood group": true, "allergies": true, "medication": true, "medical condition": true, "medical conditions": true, "pet name": true, "age": true, "phone": true, "full name": true, "primary mobile phone": true, "primary mobile": true
                            };
                            const visibleFields = additionalFields.filter(f => !renderedLabels[f.label.toLowerCase()]);

                            if (visibleFields.length === 0) return null;

                            return (
                                <div className="space-y-6">
                                    <SectionHeader icon={Zap} title="Additional Profile Details" theme={theme} />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        {additionalFields.map((field, idx) => {
                                            if (renderedLabels[field.label.toLowerCase()]) return null;

                                            return (
                                                <div key={idx} className="relative group animate-in slide-in-from-left-4 duration-300 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md transition-all">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <input
                                                            placeholder="Custom Label"
                                                            value={field.label}
                                                            onChange={(e) => handleFieldChange(idx, 'label', e.target.value)}
                                                            className="bg-transparent text-[13px] font-bold text-slate-800 outline-none focus:text-black w-2/3 transition-colors"
                                                        />

                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleFieldChange(idx, 'isPrivate', !field.isPrivate)}
                                                                title={field.isPrivate ? 'Private (Hidden)' : 'Public (Visible)'}
                                                                className={`p-1.5 rounded-lg transition-all ${field.isPrivate ? 'text-amber-500 bg-amber-50 shadow-sm ring-1 ring-amber-100' : 'text-slate-400 hover:text-black hover:bg-slate-100'}`}
                                                            >
                                                                {field.isPrivate ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeCustomField(idx)}
                                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <input
                                                        placeholder={`Enter ${field.label || 'Value'}`}
                                                        value={field.value}
                                                        onChange={(e) => handleFieldChange(idx, 'value', e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:border-slate-300 focus:bg-white outline-none transition-all shadow-inner"
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => addCustomField('Extra Detail')}
                                        className="w-full py-4 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest shadow-sm transition-all text-white hover:opacity-90 mt-4"
                                        style={{ backgroundColor: theme.primary, borderColor: theme.primary }}
                                    >
                                        <Plus className="w-4 h-4" /> Add Extra Field
                                    </button>
                                </div>
                            );
                        })()}

                        {/* Section 4 - Documentation */}
                        <div className="space-y-6">
                            <SectionHeader icon={Info} title="Critical / Private Documentation" theme={theme} />
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    {documents.map((doc, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-slate-50 p-4 rounded-xl border border-slate-100 animate-in slide-in-from-left-4 duration-300">
                                            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
                                                <div className="space-y-2">
                                                    <input
                                                        placeholder="Doc Name (Ex: ID Card)"
                                                        value={doc.label}
                                                        onChange={(e) => handleDocumentLabelChange(idx, 'label', e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 uppercase tracking-wide focus:border-slate-500 outline-none placeholder:text-slate-400"
                                                    />
                                                    <input
                                                        placeholder="Doc ID Number (Optional)"
                                                        value={doc.docId || ''}
                                                        onChange={(e) => handleDocumentLabelChange(idx, 'docId', e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 uppercase tracking-wide focus:border-slate-500 outline-none placeholder:text-slate-400"
                                                    />
                                                </div>
                                                <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between gap-2 overflow-hidden w-full">
                                                    {doc.fileName ? (
                                                        <span className="text-[10px] font-bold text-green-600 truncate flex-1 min-w-0" title={doc.fileName}>
                                                            {doc.fileName}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 shrink-0">No file</span>
                                                    )}

                                                    <label className="cursor-pointer bg-black text-white px-2.5 py-2 rounded-md text-[9px] font-black uppercase hover:bg-slate-800 transition-all flex items-center gap-1.5 shrink-0 shadow-sm">
                                                        {uploadingDoc === idx ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                                        <span className="inline">{doc.fileName ? 'Change / बदलें' : 'Click to Upload / अपलोड करें'}</span>
                                                        <input type="file" className="hidden" accept="application/pdf,image/*" onChange={(e) => handleDocumentUpload(idx, e)} />
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                                {/* Privacy Checkbox */}
                                                <div
                                                    className={`cursor-pointer py-3 px-4 sm:p-2.5 rounded-xl transition-all flex-[2] sm:flex-none flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wide border ${doc.isPrivate ? 'bg-amber-100 border-amber-200 text-amber-700 shadow-sm' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 shadow-sm'}`}
                                                    onClick={() => toggleDocumentPrivacy(idx)}
                                                    title={doc.isPrivate ? 'Private (Hidden)' : 'Public (Visible)'}
                                                >
                                                    {doc.isPrivate ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                                    <span className="sm:hidden">{doc.isPrivate ? 'Locked' : 'Public'}</span>
                                                </div>

                                                <button type="button" onClick={() => removeDocumentField(idx)} className="py-3 px-4 sm:p-2.5 bg-red-50 border border-red-200 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 rounded-xl transition-all flex-1 sm:flex-none flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wide shadow-sm">
                                                    <Trash2 className="w-4 h-4" />
                                                    <span className="sm:hidden">Delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => addDocumentField()}
                                    className="w-full py-4 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest shadow-sm transition-all text-white hover:opacity-90 mt-4"
                                    style={{ backgroundColor: theme.primary, borderColor: theme.primary }}
                                >
                                    <Plus className="w-4 h-4" /> Add Document
                                </button>
                            </div>
                        </div>

                        {/* Section 5: Privacy & Security */}
                        <div className="space-y-6">
                            <SectionHeader icon={Lock} title="Privacy & Security" theme={theme} />
                            <div className={`bg-amber-50 rounded-2xl p-6 border transition-all space-y-4 ${pinError ? 'border-red-500 ring-2 ring-red-100' : 'border-amber-100'}`}>
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${pinError ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-black uppercase tracking-wide ${pinError ? 'text-red-600' : 'text-amber-900'}`}>
                                            {pinError ? 'Access PIN Required' : 'Access PIN & Privacy'}
                                        </h4>
                                        <p className={`text-xs font-medium leading-relaxed mt-1 ${pinError ? 'text-red-500' : 'text-amber-700/80'}`}>
                                            {pinError
                                                ? 'Please create a 4-digit PIN to secure your profile.'
                                                : <span>Items marked with <Lock className="w-3 h-3 inline" /> will be hidden. A PIN is mandatory.</span>
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className={`text-[11px] font-bold uppercase tracking-wider ml-1 ${pinError ? 'text-red-600' : 'text-amber-800'}`}>Create Access PIN</label>
                                    <input
                                        ref={pinInputRef}
                                        type="tel"
                                        placeholder="Enter 4-digit PIN"
                                        maxLength={4}
                                        value={formData.access_pin}
                                        onChange={(e) => {
                                            handlePinChange(e)
                                            if (e.target.value.length > 0) setPinError(false)
                                        }}
                                        className={`w-full bg-white border rounded-xl px-4 py-3 text-sm font-black text-center tracking-[10px] outline-none shadow-sm placeholder:tracking-normal placeholder:font-normal transition-all ${pinError
                                            ? 'border-red-300 text-red-900 placeholder:text-red-300 focus:border-red-500 bg-red-50'
                                            : 'border-amber-200 text-amber-900 focus:border-amber-500'
                                            }`}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className="w-full py-5 text-white font-black text-sm uppercase tracking-[3px] rounded-2xl hover:opacity-90 transition-all active:scale-[0.99] flex items-center justify-center gap-3 mt-8 duration-500"
                            style={{ backgroundColor: theme.primary, boxShadow: `0 10px 30px -5px ${theme.primary}60` }}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                            {loading ? 'Activating...' : (initialData ? 'Update Profile' : 'Activate Protection')}
                        </button>
                    </div>
                </div>
            </div>
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}</style>
        </form>
    )
}

function GenericInput({ label, placeholder, type = 'text', additionalFields, setAdditionalFields }: any) {
    const fieldIdx = additionalFields.findIndex((f: any) => f.label.toLowerCase() === label.toLowerCase())
    const value = fieldIdx >= 0 ? additionalFields[fieldIdx].value : ''

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (fieldIdx >= 0) {
            const updated = [...additionalFields]
            updated[fieldIdx].value = e.target.value
            setAdditionalFields(updated)
        } else {
            setAdditionalFields([...additionalFields, { label, value: e.target.value, isPrivate: false }])
        }
    }
    return <FormInput label={label} name={label} value={value} onChange={handleChange} placeholder={placeholder} type={type} />
}

function SectionHeader({ icon: Icon, title, theme = { primary: '#0f172a', bg: '#f8fafc', border: '#e2e8f0', text: '#0f172a' } }: any) {
    return (
        <div className="flex items-center gap-3 pb-2 border-b transition-colors duration-500" style={{ borderColor: theme.border }}>
            <div className="p-2 rounded-xl transition-colors duration-500" style={{ backgroundColor: theme.bg, color: theme.primary }}>
                <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider transition-colors duration-500" style={{ color: theme.text }}>{title}</h3>
        </div>
    )
}

function FormInput({ label, name, value, onChange, placeholder, required, isTextArea, type = 'text' }: any) {
    return (
        <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-800 uppercase tracking-tight ml-1">{label}</label>
            {isTextArea ? (
                <textarea
                    name={name} value={value} onChange={onChange} placeholder={placeholder} required={required} rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-slate-400 outline-none transition-all resize-none shadow-sm"
                />
            ) : (
                <input
                    type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-slate-400 outline-none transition-all shadow-sm"
                />
            )}
        </div>
    )
}

function SimpleIn({ placeholder, value, onChange }: any) {
    return (
        <input
            placeholder={placeholder} value={value} onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            // Note: onChange signature fixed in props below, here just passing standard input logic
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-slate-400 outline-none transition-all shadow-sm"
        />
    )
}

function SelectIn({ options, value, onChange, placeholder }: any) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedText = value ? value : (placeholder || 'Select Relation');

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-white border ${isOpen ? 'border-slate-800 ring-2 ring-slate-100' : 'border-slate-200 hover:border-slate-300'} rounded-xl px-4 py-3 text-xs font-semibold outline-none transition-all shadow-sm flex items-center justify-between group`}
            >
                <span className={!value ? 'text-slate-400' : 'text-slate-900'}>{selectedText}</span>
                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? '-rotate-90' : 'rotate-90 group-hover:text-slate-600'}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-56 overflow-y-auto custom-scrollbar p-1.5 flex flex-col gap-0.5">
                        <button
                            type="button"
                            onClick={() => { onChange(''); setIsOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors ${!value ? 'bg-slate-50 text-slate-400' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                        >
                            {placeholder || 'Select Relation'}
                        </button>
                        {options.map((opt: string) => (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => { onChange(opt); setIsOpen(false); }}
                                className={`w-full text-left px-3 py-2.5 text-xs font-semibold rounded-lg transition-all ${value === opt ? 'bg-slate-900 text-white shadow-sm scale-[0.98]' : 'text-slate-700 hover:bg-slate-50 hover:text-black hover:scale-[0.99]"'}`}
                            >
                                {opt}
                            </button>
                        ))}
                        <div className="h-px bg-slate-100 my-1 mx-2" />
                        <button
                            type="button"
                            onClick={() => { onChange('Other'); setIsOpen(false); }}
                            className={`w-full text-left px-3 py-2.5 text-xs font-semibold rounded-lg transition-all ${value === 'Other' ? 'bg-slate-900 text-white shadow-sm scale-[0.98]' : 'text-slate-700 hover:bg-slate-50 hover:text-black hover:scale-[0.99]'}`}
                        >
                            Custom / Type Value...
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
