'use server';

import { createClient } from '@supabase/supabase-js';
import { getServerSession } from '@/lib/auth';

// Server-side Supabase client with Service Role Key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
    console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing in server environment!');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || 'placeholder', {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

/**
 * Global helper to enforce authentication and return the current session.
 * This is the FIRST line of defense in production.
 */
async function requireAuth() {
    const session = await getServerSession();
    if (!session) {
        throw new Error('UNAUTHORIZED: Please login again');
    }
    return session;
}

/**
 * Publicly accessible helper to fetch basic admin branding/info by their unique slug.
 * Used for the unique login pages.
 */
export async function getAdminBySlug(slug: string) {
    try {
        if (!supabaseServiceKey) throw new Error('Service configuration error');
        
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('id, name, email, role, status, subscription_plan, subscription_duration, custom_price, custom_days, subscription_expiry, company_name, logo_url, brand_color')
            .eq('login_slug', slug)
            .maybeSingle();

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching admin by slug:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetches detailed QR generation statistics for a user or group of users.
 * Supports Today, Monthly, Yearly, and Lifetime counts.
 */
export async function getDetailedQRStats(adminId?: string, includeSubAdmins: boolean = false) {
    try {
        const session = await requireAuth();

        // SECURITY: If NOT super_pro, you can ONLY request stats for yourself or your sub-admins.
        const targetId = (session.role === 'super_pro_admin' && adminId) ? adminId : session.id;

        let userIds = [targetId];


        if (includeSubAdmins) {
            const { data: subAdmins } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('created_by', adminId)
                .eq('role', 'sub_admin');

            if (subAdmins && subAdmins.length > 0) {
                userIds = [...userIds, ...subAdmins.map(u => u.id)];
            }
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const thisYear = new Date(now.getFullYear(), 0, 1).toISOString();

        const [todayRes, monthRes, yearRes, totalRes] = await Promise.all([
            supabaseAdmin.from('qr_codes').select('*', { count: 'exact', head: true }).in('generated_by', userIds).gte('created_at', today),
            supabaseAdmin.from('qr_codes').select('*', { count: 'exact', head: true }).in('generated_by', userIds).gte('created_at', thisMonth),
            supabaseAdmin.from('qr_codes').select('*', { count: 'exact', head: true }).in('generated_by', userIds).gte('created_at', thisYear),
            supabaseAdmin.from('qr_codes').select('*', { count: 'exact', head: true }).in('generated_by', userIds)
        ]);

        return {
            today: todayRes.count || 0,
            month: monthRes.count || 0,
            year: yearRes.count || 0,
            total: totalRes.count || 0
        };
    } catch (error) {
        console.error('Error fetching QR stats:', error);
        return { today: 0, month: 0, year: 0, total: 0 };
    }
}

export async function getMonthlyQRHistory(adminId?: string, includeSubAdmins: boolean = false) {
    try {
        if (!supabaseServiceKey) throw new Error('Service configuration error');

        const session = await requireAuth();
        const targetId = (session.role === 'super_pro_admin' && adminId) ? adminId : session.id;

        let userIds = [targetId];
        if (includeSubAdmins) {
            const { data: subs } = await supabaseAdmin.from('users').select('id').eq('created_by', targetId);
            if (subs) userIds = [...userIds, ...subs.map(s => s.id)];
        }

        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1).toISOString();

        const { data: qrCodes, error } = await supabaseAdmin
            .from('qr_codes')
            .select('created_at')
            .in('generated_by', userIds)
            .gte('created_at', startOfYear);

        if (error) throw error;

        // Group by month
        const monthlyStats: any = {};
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        // Initialize with 0s
        monthNames.forEach(m => monthlyStats[m] = 0);

        (qrCodes || []).forEach(qr => {
            const date = new Date(qr.created_at);
            const monthName = monthNames[date.getMonth()];
            monthlyStats[monthName]++;
        });

        return { success: true, data: monthlyStats };
    } catch (error: any) {
        console.error('Error fetching monthly history:', error);
        return { success: false, error: error.message };
    }
}
export async function getAdmins() {
    try {
        const session = await requireAuth();
        if (session.role !== 'super_pro_admin') {
            throw new Error('FORBIDDEN: Only Master Admins can access global user list');
        }

        if (!supabaseServiceKey) throw new Error('Service configuration error');

        const { data: users, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .in('role', ['super_admin', 'sub_admin', 'analytics_admin'])
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch aggregate stats for each user
        // Super Admins see their combined total (self + sub-admins)
        // Sub Admins see only their own (for legacy support if needed)
        const usersWithCounts = await Promise.all(users.map(async (user) => {
            const stats = await getDetailedQRStats(user.id, user.role === 'super_admin');
            return {
                ...user,
                total_qr_codes: stats.total,
                stats
            };
        }));

        return { success: true, data: usersWithCounts };
    } catch (error: any) {
        console.error('Error fetching admins:', error);
        return { success: false, error: error.message };
    }
}

export async function getSubAdmins(targetAdminId?: string) {
    try {
        const session = await requireAuth();
        const superAdminId = (session.role === 'super_pro_admin' && targetAdminId) ? targetAdminId : session.id;

        if (!supabaseServiceKey) throw new Error('Service configuration error');

        const { data: users, error } = await supabaseAdmin
            .from('users')
            .select('*, passcode')
            .eq('role', 'sub_admin')
            .eq('created_by', superAdminId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch individual stats for each sub_admin
        const usersWithCounts = await Promise.all(users.map(async (user) => {
            const stats = await getDetailedQRStats(user.id, false);
            return {
                ...user,
                total_qr_codes: stats.total,
                stats
            };
        }));

        return { success: true, data: usersWithCounts };
    } catch (error: any) {
        console.error('Error fetching sub-admins:', error);
        return { success: false, error: error.message };
    }
}

export async function createAdmin(adminData: any) {
    try {
        const session = await requireAuth();

        // SECURITY: Only Super Admin can create sub_admin. Only Super Pro can create super_admin.
        if (session.role === 'sub_admin') {
            throw new Error('FORBIDDEN: Operators cannot create new admins');
        }

        if ((adminData.role === 'super_admin' || adminData.role === 'analytics_admin') && session.role !== 'super_pro_admin') {
            throw new Error('FORBIDDEN: Only Global Masters can create Super Admins or Analytics Portals');
        }

        if (!supabaseServiceKey) throw new Error('Service configuration error');

        let finalCreatedBy = adminData.created_by;

        // Ensure newly created admins without explicitly passed created_by are assigned to the current session user.
        if (!finalCreatedBy) {
            finalCreatedBy = session.id;
        }

        // Validate UUID format
        const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        // Resolve Super Pro ID if passed as string (from UI or dummy session)
        if (finalCreatedBy === 'super_pro_admin' || finalCreatedBy === 'super-pro-master' || (finalCreatedBy && !isValidUUID(finalCreatedBy))) {
            const { data: spUser } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('role', 'super_pro_admin')
                .limit(1)
                .maybeSingle();
            if (spUser) {
                finalCreatedBy = spUser.id;
            } else {
                finalCreatedBy = null; // MUST be null, not a dummy string, to avoid Postgres UUID errors
            }
        }
        else if (finalCreatedBy) {
            const { data: checkCreated } = await supabaseAdmin.from('users').select('id').eq('id', finalCreatedBy).maybeSingle();
            if (!checkCreated) finalCreatedBy = null;
        }

        console.log(`Creating admin: ${adminData.email} (${adminData.role}) by ${finalCreatedBy}`);

        const { data: userRecord } = await supabaseAdmin
            .from('users')
            .select('id, login_slug')
            .eq('email', adminData.email)
            .maybeSingle();

        const { data: profileRecord } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', adminData.email)
            .maybeSingle();

        const existingPublicId = userRecord?.id || profileRecord?.id;
        let finalUserId = existingPublicId;

        let authUser = null;
        if (existingPublicId) {
            try {
                const { data, error: fetchErr } = await supabaseAdmin.auth.admin.getUserById(existingPublicId);
                if (!fetchErr) authUser = data?.user;
            } catch (e) {
                console.warn('Auth check skipped for user');
            }
        }

        if (existingPublicId && !authUser) {
            const timestamp = Date.now();
            const archivedEmail = `archived_${timestamp}_${adminData.email}`;
            const archivedSlug = userRecord?.login_slug ? `archived_${timestamp}_${userRecord.login_slug}` : null;

            await supabaseAdmin.from('users')
                .update({
                    email: archivedEmail,
                    status: 'archived',
                    ...(archivedSlug && { login_slug: archivedSlug })
                })
                .eq('email', adminData.email);

            await supabaseAdmin.from('profiles')
                .update({ email: archivedEmail, status: 'suspended' })
                .eq('email', adminData.email);

            finalUserId = null;
        }

        let authData = null;
        if (!finalUserId) {
            const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: adminData.email,
                password: adminData.password || `Admin@${Math.random().toString(36).slice(-8)}!`,
                email_confirm: true,
                user_metadata: { name: adminData.name }
            });

            if (authError) {
                if (authError.message?.toLowerCase().includes('already registered') || authError.status === 422) {
                    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
                    const foundUser = listData.users.find(u => u.email === adminData.email);
                    if (foundUser) {
                        authData = { user: foundUser };
                        finalUserId = foundUser.id;
                    } else {
                        throw authError;
                    }
                } else {
                    throw authError;
                }
            } else {
                authData = data;
                finalUserId = authData.user.id;
            }
        }

        const targetUserId = finalUserId || (authData ? authData.user.id : null);
        if (!targetUserId) throw new Error('Failed to determine User ID');

        const { error: upsertError } = await supabaseAdmin
            .from('users')
            .upsert({
                id: targetUserId,
                email: adminData.email,
                name: adminData.name,
                role: adminData.role,
                login_slug: adminData.login_slug,
                status: adminData.status || 'active',
                subscription_plan: adminData.subscription_plan || 'free',
                subscription_expiry: adminData.subscription_expiry,
                subscription_duration: adminData.subscription_duration,
                custom_price: adminData.custom_price,
                custom_days: adminData.custom_days,
                passcode: adminData.passcode,
                created_by: finalCreatedBy,
                password_hash: 'otp_authenticated',
                company_name: adminData.company_name,
                logo_url: adminData.logo_url,
                brand_color: adminData.brand_color,
            });

        if (upsertError) throw upsertError;

        const bcrypt = require('bcryptjs');
        const passcodeHash = await bcrypt.hash(adminData.passcode, 10);
        await supabaseAdmin.from('admin_passcodes').delete().eq('admin_id', targetUserId);
        const { error: passcodeError } = await supabaseAdmin
            .from('admin_passcodes')
            .insert({
                admin_id: targetUserId,
                passcode_hash: passcodeHash,
                is_active: true
            });

        if (passcodeError) throw passcodeError;
        return { success: true, userId: targetUserId };
    } catch (error: any) {
        console.error('Error creating admin:', error);
        let errorMessage = error.message;
        if (error.code === '23505') {
            if (error.details && error.details.includes('login_slug')) {
                errorMessage = 'This Access Slug is already taken. Please choose another.';
            } else if (error.details && error.details.includes('email')) {
                errorMessage = 'This Email is already registered.';
            } else {
                errorMessage = 'A profile with these unique details already exists.';
            }
        }
        return { success: false, error: errorMessage };
    }
}

export async function updateAdmin(adminId: string, updates: any) {
    try {
        const session = await requireAuth();

        // SECURITY: Only Super Pro can update ANYONE. 
        // Super Admin can ONLY update their own sub-admins.
        if (session.role !== 'super_pro_admin') {
            const { data: targetAdmin } = await supabaseAdmin.from('users').select('created_by').eq('id', adminId).single();
            if (!targetAdmin || targetAdmin.created_by !== session.id) {
                throw new Error('ACCESS DENIED: You cannot update this operator');
            }
        }

        if (!supabaseServiceKey) throw new Error('Service configuration error');
        // 1. Update public user record
        const { passcode, password, id, created_at, ...userUpdates } = updates;

        const { error: userError } = await supabaseAdmin
            .from('users')
            .update({
                name: updates.name,
                email: updates.email,
                role: updates.role,
                status: updates.status,
                subscription_plan: updates.subscription_plan,
                subscription_expiry: updates.subscription_expiry,
                subscription_duration: updates.subscription_duration,
                custom_price: updates.custom_price,
                custom_days: updates.custom_days,
                passcode: updates.passcode,
                login_slug: updates.login_slug,
                company_name: updates.company_name,
                logo_url: updates.logo_url,
                brand_color: updates.brand_color
            })
            .eq('id', adminId);

        if (userError) throw userError;

        if (passcode && passcode.length === 6) {
            const bcrypt = require('bcryptjs');
            const passcodeHash = await bcrypt.hash(passcode, 10);
            await supabaseAdmin.from('admin_passcodes').delete().eq('admin_id', adminId);
            const { error: passcodeError } = await supabaseAdmin
                .from('admin_passcodes')
                .insert({
                    admin_id: adminId,
                    passcode_hash: passcodeHash,
                    is_active: true
                });
            if (passcodeError) throw passcodeError;
        }
        return { success: true };
    } catch (error: any) {
        console.error('Error updating admin:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteAdmin(adminId: string) {
    try {
        const session = await requireAuth();

        // SECURITY: Only Super Pro can delete anyone. Super Admin can only delete their own sub-admins.
        if (session.role !== 'super_pro_admin') {
            const { data: target } = await supabaseAdmin.from('users').select('created_by').eq('id', adminId).single();
            if (!target || target.created_by !== session.id) {
                throw new Error('FORBIDDEN: You do not have permission to delete this account');
            }
        }

        if (!supabaseServiceKey) throw new Error('Service configuration error');
        await supabaseAdmin.from('qr_codes').delete().eq('created_by', adminId);
        await supabaseAdmin.from('admin_passcodes').delete().eq('admin_id', adminId);
        await supabaseAdmin.from('revenue_transactions').delete().eq('admin_id', adminId);
        await supabaseAdmin.from('admin_activity_log').delete().eq('admin_id', adminId);

        try {
            const { error } = await supabaseAdmin.auth.admin.deleteUser(adminId);
            if (error) throw error;
        } catch (authError: any) {
            console.log('Auth user cleanup handled.');
        }

        await supabaseAdmin.from('users').delete().eq('id', adminId);
        await supabaseAdmin.from('profiles').delete().eq('id', adminId);
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting admin:', error);
        return { success: false, error: error.message };
    }
}

export async function generateQRCodes(quantity: number, adminId?: string, isSuperPro: boolean = false, expirationDays: number | null = null, fixedCategory: string | null = null) {
    try {
        const session = await requireAuth();

        // PRIORITY Logic:
        // 1. If adminId explicitly passed (e.g. from dropdown), use it.
        // 2. Otherwise default to current session's ID.
        let finalUserId: string | null = adminId || session.id;

        // Security check for assignment
        if (adminId && session.role !== 'super_pro_admin') {
            // Non-super-pros can't assign to others
            finalUserId = session.id;
        }

        // PROTECT DB: Prevent inserting raw string password/slugs into UUID columns
        if (finalUserId === 'super-pro-master' || finalUserId === 'super_pro_master') {
            finalUserId = null;
        }

        if (!supabaseServiceKey) throw new Error('Service configuration error');

        let sequenceQuery = supabaseAdmin.from('qr_codes').select('sequence_number').order('sequence_number', { ascending: false }).limit(1);

        const { data: qrs } = await sequenceQuery;
        let currentSequence = qrs?.[0]?.sequence_number || 0;
        const newQRs = [];
        const { v4: uuidv4 } = require('uuid');
        let expirationDate: string | null = null;

        if (expirationDays && expirationDays > 0) {
            const date = new Date();
            date.setDate(date.getDate() + expirationDays);
            expirationDate = date.toISOString();
        }

        for (let i = 0; i < quantity; i++) {
            currentSequence++;
            const qrId = uuidv4();
            const qrNumber = String(currentSequence).padStart(2, '0');
            const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.qraksha.in').replace(/\/$/, '');
            newQRs.push({
                generated_by: finalUserId,
                id: qrId,
                category: fixedCategory || 'custom-category',
                fixed_category: (fixedCategory && fixedCategory !== 'custom-category') ? fixedCategory : null,
                status: 'generated',
                qr_number: qrNumber,
                sequence_number: currentSequence,
                full_url: `${baseUrl}/scan/${qrId}`,
                created_at: new Date().toISOString(),
                // FIXED: Clock SHOULD NOT start at generation. 
                // Store intended days in subscription_period; subscription_end stays null until first scan.
                subscription_period: expirationDays,
                subscription_end: null
            });
        }

        const { data, error } = await supabaseAdmin.from('qr_codes').insert(newQRs).select();
        if (error) throw error;
        return { success: true, data: data };
    } catch (error: any) {
        console.error('Error generating QR codes:', error);
        return { success: false, error: error.message };
    }
}

import { clearServerSession, setServerSession } from '@/lib/auth';

export async function completeLogin(user: any) {
    try {
        await setServerSession({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            loginTime: new Date().toISOString()
        });
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function logout() {
    await clearServerSession();
    return { success: true };
}

export async function getAdminDashboardStats(adminId?: string, isSuperPro: boolean = false) {
    try {
        const session = await requireAuth();
        const role = session.role;
        const userId = (role === 'super_pro_admin' && adminId) ? adminId : session.id;

        if (!supabaseServiceKey) throw new Error('Service configuration error');

        // 1. Identify target users & pre-fetch QR IDs if needed
        let targetUserIds = [userId];
        let qrIds: string[] = [];
        const isMaster = (role === 'super_pro_admin' || isSuperPro);

        if (!isMaster) {
            if (role === 'super_admin') {
                const { data: subs } = await supabaseAdmin.from('users').select('id').eq('created_by', userId);
                if (subs) targetUserIds = [...targetUserIds, ...subs.map(s => s.id)];
            }

            // Single fetch for all relevant QR IDs to avoid multiple round-trips
            const { data: userQRs } = await supabaseAdmin.from('qr_codes').select('id').in('generated_by', targetUserIds);
            qrIds = userQRs?.map(qr => qr.id) || [];

            // If user has no QRs, return empty early with counts
            if (qrIds.length === 0) {
                return { success: true, data: { totalQRs: 0, activeQRs: 0, scans: 0, alerts: 0, recentAlerts: [] } };
            }
        }

        // 2. Perform parallel counts
        let qrQuery = supabaseAdmin.from('qr_codes').select('*', { count: 'estimated', head: true });
        let activeQrQuery = supabaseAdmin.from('qr_codes').select('*', { count: 'estimated', head: true }).not('owner_name', 'is', null);
        let alertQuery = supabaseAdmin.from('emergency_alerts').select('*', { count: 'estimated', head: true });

        if (!isMaster) {
            qrQuery = qrQuery.in('generated_by', targetUserIds);
            activeQrQuery = activeQrQuery.in('generated_by', targetUserIds);
            alertQuery = alertQuery.in('qr_id', qrIds);
        }

        const [qrs, aqrs, alerts] = await Promise.all([qrQuery, activeQrQuery, alertQuery]);

        // 3. Fetch Recent Alerts with Names
        let recentAlertsQuery = supabaseAdmin
            .from('emergency_alerts')
            .select('id, qr_id, alert_time, latitude, longitude, location_address, google_maps_link, alert_type, status')
            .order('alert_time', { ascending: false })
            .limit(5);

        if (!isMaster) {
            recentAlertsQuery = recentAlertsQuery.in('qr_id', qrIds);
        }

        const { data: alertsData } = await recentAlertsQuery;
        let alertsWithNames: any[] = [];

        if (alertsData && alertsData.length > 0) {
            const uniqueQrIds = Array.from(new Set(alertsData.map((a: any) => a.qr_id)));
            const { data: owners } = await supabaseAdmin
                .from('qr_details')
                .select('qr_id, full_name')
                .in('qr_id', uniqueQrIds);

            const ownersMap = (owners || []).reduce((acc: any, o) => {
                acc[o.qr_id] = o.full_name;
                return acc;
            }, {});

            const alertPhotosMap: any = {};
            await Promise.all(alertsData.map(async (alert: any) => {
                const qrId = alert.qr_id;
                const alertId = alert.id;

                // Primary path: specific alert subfolder
                let path = `emergencies/${qrId}/${alertId}`;
                let { data: files } = await supabaseAdmin.storage.from('emergency-evidence').list(path);

                // Fallback: root emergency folder for this QR (legacy)
                if (!files || files.length === 0) {
                    path = `emergencies/${qrId}`;
                    const { data: legacyFiles } = await supabaseAdmin.storage.from('emergency-evidence').list(path);
                    files = legacyFiles;
                }

                if (files && files.length > 0) {
                    const sortedFiles = files.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
                    const imageFiles = sortedFiles.filter(f => {
                        const name = f.name.toLowerCase();
                        return name.includes('.') && (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp'));
                    });

                    if (imageFiles.length > 0) {
                        const firstFile = imageFiles[0].name;
                        const { data } = await supabaseAdmin.storage.from('emergency-evidence').createSignedUrl(`${path}/${firstFile}`, 3600);
                        if (data) alertPhotosMap[alertId] = data.signedUrl;
                    }
                }
            }));

            alertsWithNames = alertsData.map((alert: any) => ({
                ...alert,
                owner_name: ownersMap[alert.qr_id] || 'Anonymous',
                evidence_photo: alertPhotosMap[alert.id] || null
            }));
        }

        // --- 5. RECENT SCANS LOGIC (DAILY) ---
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: scanHistory } = await supabaseAdmin
            .from('emergency_alerts')
            .select('created_at')
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: true });

        const dailyScans = (scanHistory || []).reduce((acc: any, scan) => {
            const day = new Date(scan.created_at).toLocaleDateString('en-US', { weekday: 'short' });
            acc[day] = (acc[day] || 0) + 1;
            return acc;
        }, {});

        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short' });
        const todayIdx = days.indexOf(todayStr);
        const sortedDays = [...days.slice(todayIdx + 1), ...days.slice(0, todayIdx + 1)];

        const scanStats = sortedDays.map(day => ({
            name: day,
            scans: dailyScans[day] || 0
        }));

        return {
            success: true,
            data: {
                totalQRs: qrs.count || 0,
                activeQRs: aqrs.count || 0,
                scans: alerts.count || 0, // Using total alerts as scans for now
                alerts: alerts.count || 0,
                recentAlerts: alertsWithNames || [],
                scanStats
            }
        };

    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function verifyAdminPasscode(adminId: string, passcode: string) {
    try {
        // No requireAuth here as it is used during login
        if (!supabaseServiceKey) throw new Error('Service configuration error');
        const { data: passcodeData, error } = await supabaseAdmin.from('admin_passcodes').select('passcode_hash').eq('admin_id', adminId).eq('is_active', true).maybeSingle();
        if (error || !passcodeData) return { success: false, error: 'Passcode not found.' };
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(passcode, passcodeData.passcode_hash);
        if (!isMatch) return { success: false, error: 'Invalid passcode' };
        return { success: true };
    } catch (error: any) {
        console.error('Passcode verification error:', error);
        return { success: false, error: error.message };
    }
}

export async function globalLogin(email: string, passcode: string) {
    try {
        if (!supabaseServiceKey) throw new Error('Service configuration error');
        const { data: user, error: userError } = await supabaseAdmin.from('users').select('id, email, name, role, status').eq('email', email).maybeSingle();
        if (userError || !user) return { success: false, error: 'Account not found.' };
        if (user.status !== 'active') return { success: false, error: 'Account suspended.' };
        const verifyResult = await verifyAdminPasscode(user.id, passcode);
        if (!verifyResult.success) return verifyResult;
        await supabaseAdmin.from('admin_activity_log').insert({ admin_id: user.id, action: 'LOGIN', target_type: 'global_login', details: { email: email, role: user.role } });
        return { success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
    } catch (error: any) {
        console.error('Global login error:', error);
        return { success: false, error: error.message };
    }
}

export async function toggleQRStatus(id: string, newStatus: string) {
    try {
        const session = await requireAuth();

        // SECURITY: Check ownership of QR code
        if (session.role !== 'super_pro_admin') {
            const { data: qr } = await supabaseAdmin.from('qr_codes').select('generated_by').eq('id', id).single();
            if (!qr || qr.generated_by !== session.id) {
                // Also check if it belongs to one of their sub-admins if they are Super Admin
                let isOwnedBySub = false;
                if (session.role === 'super_admin') {
                    const { data: subs } = await supabaseAdmin.from('users').select('id').eq('created_by', session.id);
                    const subIds = subs?.map(s => s.id) || [];
                    if (subIds.includes(qr?.generated_by)) isOwnedBySub = true;
                }

                if (!isOwnedBySub) throw new Error('FORBIDDEN: You do not own this QR code');
            }
        }

        const dbStatus = (newStatus === 'inactive' || newStatus === 'expired') ? 'expired' : 'activated';
        const { error } = await supabaseAdmin.from('qr_codes').update({ status: dbStatus }).eq('id', id);
        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Error toggling QR status:', error);
        return { success: false, error: error.message };
    }
}

export async function saveQRProfile(payload: { qrId: string, category: string, formData: any, additionalFields: any[], documents: any[], emergencyContacts: any[] }) {
    try {
        const session = await getServerSession();
        const { qrId, category, formData, additionalFields, documents, emergencyContacts } = payload;

        // 0. Fetch target QR code status 
        const { data: qr } = await supabaseAdmin.from('qr_codes').select('status, generated_by, subscription_period').eq('id', qrId).single();
        if (!qr) throw new Error('Security Error: QR code not found');

        // SECURITY: 
        // 1. Activation (generated): ANYONE 
        // 2. Admin: Ownership check
        // 3. Holder Edit: PIN check
        let isAuthorized = false;

        if (qr.status === 'generated') {
            isAuthorized = true;
        } else if (session) {
            if (session.role === 'super_pro_admin') isAuthorized = true;
            else if (qr.generated_by === session.id) isAuthorized = true;
            else if (session.role === 'super_admin') {
                const { data: subs } = await supabaseAdmin.from('users').select('id').eq('created_by', session.id);
                if (subs?.some(s => s.id === qr.generated_by)) isAuthorized = true;
            }
        } else {
            const { data: details } = await supabaseAdmin.from('qr_details').select('additional_data').eq('qr_id', qrId).maybeSingle();
            const storedPin = details?.additional_data?.access_pin;
            if (!storedPin || formData.access_pin === storedPin) isAuthorized = true;
        }

        if (!isAuthorized) {
            throw new Error('UNAUTHORIZED: Please login as admin or provide correct PIN');
        }

        if (!supabaseServiceKey) throw new Error('Service configuration error');
        // 1. Check if details already exist to get the ID (Safely handle duplicates)
        const { data: existing } = await supabaseAdmin
            .from('qr_details')
            .select('id')
            .eq('qr_id', qrId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        // 2. Upsert QR Details
        const { error: detailsError } = await supabaseAdmin.from('qr_details').upsert({
            id: existing?.id, // Important for update
            qr_id: qrId,
            category,
            full_name: formData.full_name,
            age: formData.age ? parseInt(formData.age) : null,
            home_address: formData.home_address,
            blood_group: formData.blood_group,
            phone: formData.phone,
            additional_data: {
                photo_url: formData.photo_url,
                custom_fields: additionalFields.filter(f => f.label && f.value),
                documents: documents.filter(d => d.url && d.label),
                critical_alert: formData.critical_alert,
                access_pin: formData.access_pin,
                pincode: formData.pincode,
                city: formData.city,
                state: formData.state,
                landmark: formData.landmark,
                emergency_email: formData.emergency_email?.toLowerCase().trim(),
                is_address_private: formData.is_address_private,
                insurance_expiry: formData.insurance_expiry
            }
        });

        if (detailsError) throw detailsError;
        await supabaseAdmin.from('emergency_contacts').delete().eq('qr_id', qrId);
        const contactsToInsert = emergencyContacts.filter(c => c.name.trim() && c.phone.trim()).map(({ id, ...rest }) => ({ qr_id: qrId, ...rest }));
        if (contactsToInsert.length > 0) await supabaseAdmin.from('emergency_contacts').insert(contactsToInsert);

        // Handle post-generation activation timing
        let finalExpiry = undefined;
        let startTimestamp = undefined;

        if (qr.status === 'generated') {
            startTimestamp = new Date().toISOString();
            if (qr.subscription_period && qr.subscription_period > 0) {
                const date = new Date();
                date.setDate(date.getDate() + qr.subscription_period);
                finalExpiry = date.toISOString();
            }
        }

        await supabaseAdmin.from('qr_codes').update({
            status: 'activated',
            category,
            ...(finalExpiry && { subscription_end: finalExpiry }),
            ...(startTimestamp && { subscription_start: startTimestamp })
        }).eq('id', qrId);

        return { success: true };
    } catch (error: any) {
        console.error('Save QR Profile Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getLiveAnalytics(adminId: string, isSuperPro: boolean) {
    try {
        if (!supabaseAdmin) throw new Error('Service configuration error');
        let qrQuery = supabaseAdmin.from('qr_codes').select('id, category, scan_count');
        if (!isSuperPro) qrQuery = qrQuery.eq('generated_by', adminId);
        const { data: qrCodes, error: qrError } = await qrQuery;
        if (qrError) throw qrError;
        const myQrIds = (qrCodes || []).map(q => q.id);
        let logs: any[] = [];
        let alerts: any[] = [];
        if (myQrIds.length > 0) {
            const { data: logsData } = await supabaseAdmin.from('scan_logs').select('scanned_at, user_agent, scan_location, qr_id').in('qr_id', myQrIds).order('scanned_at', { ascending: true });
            logs = logsData || [];
            const { data: alertsData } = await supabaseAdmin.from('emergency_alerts').select('created_at, qr_id').in('qr_id', myQrIds);
            alerts = alertsData || [];
        }
        return { success: true, data: { qrCodes: qrCodes || [], logs, alerts } };
    } catch (error: any) {
        console.error('Analytics Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getGlobalHierarchy() {
    try {
        const session = await requireAuth();
        if (session.role !== 'super_pro_admin') {
            throw new Error('FORBIDDEN: Only Global Masters can access global hierarchy data');
        }

        if (!supabaseServiceKey) throw new Error('Service configuration error');
        const { data: allUsers, error } = await supabaseAdmin.from('users').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        const { data: allQRs } = await supabaseAdmin.from('qr_codes').select('id, qr_number, status, generated_by, created_at').order('created_at', { ascending: false });
        const qrsByAdmin: any = {};
        (allQRs || []).forEach(qr => { if (qr.generated_by) { if (!qrsByAdmin[qr.generated_by]) qrsByAdmin[qr.generated_by] = []; qrsByAdmin[qr.generated_by].push(qr); } });
        const superAdmins = allUsers.filter(u => u.role === 'super_admin');
        const subAdmins = allUsers.filter(u => u.role === 'sub_admin' || u.role === 'analytics_admin');
        const hierarchy = await Promise.all(superAdmins.map(async (admin) => {
            const children = subAdmins.filter(sub => sub.created_by === admin.id);
            const adminStats = await getDetailedQRStats(admin.id, true);

            const mappedSubAdmins = await Promise.all(children.map(async (sub) => {
                const subStats = await getDetailedQRStats(sub.id, false);
                return {
                    ...sub,
                    qr_codes: qrsByAdmin[sub.id] || [],
                    total_qr_codes: subStats.total,
                    stats: subStats,
                    parent_name: admin.name
                };
            }));

            return {
                ...admin,
                qr_codes: qrsByAdmin[admin.id] || [],
                total_qr_codes: adminStats.total,
                stats: adminStats,
                sub_admins: mappedSubAdmins
            };
        }));

        const { data: spUser } = await supabaseAdmin.from('users').select('id').eq('role', 'super_pro_admin').maybeSingle();
        const spChildren = subAdmins.filter(sub => sub.created_by === spUser?.id || sub.created_by === 'super_pro_admin' || !sub.created_by);

        const mappedOrphans = await Promise.all(spChildren.map(async (sub) => {
            const subStats = await getDetailedQRStats(sub.id, false);
            return {
                ...sub,
                qr_codes: qrsByAdmin[sub.id] || [],
                total_qr_codes: subStats.total,
                stats: subStats,
                parent_name: 'Super Pro'
            };
        }));

        return { success: true, data: { hierarchy, orphans: mappedOrphans } };
    } catch (error: any) {
        console.error('Error fetching global hierarchy:', error);
        return { success: false, error: error.message };
    }
}
export async function getAlertDetails(alertId: string) {
    try {
        if (!supabaseServiceKey) throw new Error('Service configuration error');

        // 1. Fetch Alert
        const { data: alert, error: alertError } = await supabaseAdmin
            .from('emergency_alerts')
            .select('*')
            .eq('id', alertId)
            .single();

        if (alertError) throw alertError;

        // 2. Fetch QR Details (Owner Info)
        const { data: owner, error: ownerError } = await supabaseAdmin
            .from('qr_details')
            .select('*')
            .eq('qr_id', alert.qr_id)
            .maybeSingle();

        // 3. Fetch Emergency Contacts
        const { data: contacts } = await supabaseAdmin
            .from('emergency_contacts')
            .select('*')
            .eq('qr_id', alert.qr_id)
            .order('priority', { ascending: true });

        // 4. Fetch Evidence Photos from Storage
        // Fallback pattern: first check emergencies/{qrId}/{alertId}, then emergencies/{qrId}
        let folderPath = `emergencies/${alert.qr_id}/${alert.id}`;
        let { data: files } = await supabaseAdmin.storage.from('emergency-evidence').list(folderPath);

        // Filter for real image images
        const isImage = (name: string) => {
            const lower = name.toLowerCase();
            return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp');
        };

        const imageFiles = (files || []).filter(f => isImage(f.name));

        if (imageFiles.length === 0) {
            folderPath = `emergencies/${alert.qr_id}`;
            const { data: legacyFiles } = await supabaseAdmin.storage.from('emergency-evidence').list(folderPath);
            const legacyImageFiles = (legacyFiles || []).filter(f => isImage(f.name));
            files = legacyImageFiles;
        } else {
            files = imageFiles;
        }

        const photoUrls = await Promise.all((files || []).map(async (file) => {
            const { data, error } = await supabaseAdmin
                .storage
                .from('emergency-evidence')
                .createSignedUrl(`${folderPath}/${file.name}`, 3600);
            return data?.signedUrl || '';
        }));

        return {
            success: true,
            data: {
                alert,
                owner,
                contacts: contacts || [],
                photos: photoUrls.filter(url => url !== '')
            }
        };

    } catch (error: any) {
        console.error('Error fetching alert details:', error);
        return { success: false, error: error.message };
    }
}

// ─── PURCHASE ORDERS SERVER ACTIONS ──────────────────────────────
export async function getPurchaseOrdersServer() {
    try {
        if (!supabaseServiceKey) throw new Error('Service configuration error');
        const { data, error } = await supabaseAdmin
            .from('qr_purchase_orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updatePurchaseOrderStatusServer(orderId: string, status: string) {
    try {
        if (!supabaseServiceKey) throw new Error('Service configuration error');
        const { error } = await supabaseAdmin
            .from('qr_purchase_orders')
            .update({ status })
            .eq('order_id', orderId);

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteQRCode(qrId: string) {
    try {
        const session = await requireAuth();
        
        if (session.role === 'analytics_admin') {
            throw new Error('FORBIDDEN: Analytics admins cannot delete records');
        }

        // 1. Fetch QR Details to check ownership
        const { data: qr, error: fetchError } = await supabaseAdmin
            .from('qr_codes')
            .select('generated_by')
            .eq('id', qrId)
            .single();
            
        if (fetchError || !qr) throw new Error('QR Node not found or already deleted');

        // SECURITY check
        let isAuthorized = false;
        if (session.role === 'super_pro_admin') {
            isAuthorized = true;
        } else if (qr.generated_by === session.id) {
            isAuthorized = true;
        } else if (session.role === 'super_admin') {
            const { data: subs } = await supabaseAdmin.from('users').select('id').eq('created_by', session.id);
            const subIds = subs?.map(s => s.id) || [];
            if (subIds.includes(qr.generated_by)) isAuthorized = true;
        }

        if (!isAuthorized) throw new Error('UNAUTHORIZED: You do not own this QR node');

        // 2. Perform deletion
        // Manual delete of related tables that might NOT have CASCADE set correctly in current DB state
        // (Just to be resilient against missing migrations)
        try {
            await supabaseAdmin.from('emergency_alerts').delete().eq('qr_id', qrId);
            await supabaseAdmin.from('emergency_contacts').delete().eq('qr_id', qrId);
            await supabaseAdmin.from('qr_details').delete().eq('qr_id', qrId);
            await supabaseAdmin.from('scan_logs').delete().eq('qr_id', qrId);
        } catch (e) {
            console.warn('Silent failure deleting child records:', e);
        }

        const { error: deleteError } = await supabaseAdmin.from('qr_codes').delete().eq('id', qrId);
        
        if (deleteError) throw deleteError;

        return { success: true };
    } catch (error: any) {
        console.error('Delete QR Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getGlobalAdminStats() {
    try {
        const session = await requireAuth();
        if (session.role !== 'super_pro_admin') {
            throw new Error('FORBIDDEN: Access level insufficient');
        }

        if (!supabaseServiceKey) throw new Error('Service configuration error');

        const { count: totalCount } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).in('role', ['super_admin', 'sub_admin', 'analytics_admin']);
        const { count: adminCount } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).in('role', ['super_admin', 'sub_admin', 'analytics_admin']).eq('status', 'active');
        const { count: qrCount } = await supabaseAdmin.from('qr_codes').select('*', { count: 'exact', head: true });
        const { count: activeQRCount } = await supabaseAdmin.from('qr_codes').select('*', { count: 'exact', head: true }).eq('status', 'activated');
        
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const { count: scansCount } = await supabaseAdmin.from('scan_logs').select('*', { count: 'exact', head: true }).gte('scanned_at', startOfToday);

        return {
            success: true,
            data: {
                totalSuperAdmins: totalCount || 0,
                activeSuperAdmins: adminCount || 0,
                pendingApprovals: 0,
                totalQRCodes: qrCount || 0,
                activeQRCodes: activeQRCount || 0,
                todayScans: scansCount || 0,
            }
        };
    } catch (e: any) {
        console.error('Global stats error:', e);
        return { success: false, error: e.message };
    }
}
