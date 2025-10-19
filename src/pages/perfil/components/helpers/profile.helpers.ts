import type { IUserMe } from '@/interface/user.interface';

export const toGenderFormValue = (value?: string | null) => {
  if (!value) return '';
  switch (value) {
    case 'male':
      return '1';
    case 'female':
      return '2';
    case 'other':
      return '0';
    default:
      return value;
  }
};

export const toGenderApiValue = (value?: string | null) => {
  switch (value) {
    case '1':
      return 'male';
    case '2':
      return 'female';
    case '0':
      return 'other';
    default:
      return value || null;
  }
};

export type GeoInit = { region: string; provincia: string; comuna: string };

export const normalizeInitialGeoFromUser = (user?: IUserMe | (IUserMe & Record<string, any>) | null): GeoInit => {
  const anyUser: any = user ?? {};

  const comuna = anyUser?.comuna != null
    ? String(anyUser.comuna)
    : anyUser?.comuna_id != null
      ? String(anyUser.comuna_id)
      : anyUser?.commune?.id != null
        ? String(anyUser.commune.id)
        : '';

  const provincia = anyUser?.provincia != null
    ? String(anyUser.provincia)
    : anyUser?.commune?.province?.id != null
      ? String(anyUser.commune.province.id)
      : '';

  const region = anyUser?.region != null
    ? String(anyUser.region)
    : anyUser?.commune?.province?.region?.id != null
      ? String(anyUser.commune.province.region.id)
      : '';

  return { region, provincia, comuna };
};

export const getAvatarUrlFromUser = (user?: IUserMe | (IUserMe & Record<string, any>) | null): string | null => {
  const avatarData = (user as any)?.image;
  if (typeof avatarData === 'string') return avatarData;
  if (!avatarData) return null;
  const candidates = [
    avatarData?.md,
    avatarData?.sm,
    avatarData?.lg,
    avatarData?.original_url,
    avatarData?.url,
    avatarData?.path,
    avatarData?.thumb,
    avatarData?.medium,
    avatarData?.full,
    avatarData?.urls?.md,
    avatarData?.urls?.sm,
    avatarData?.urls?.lg,
    avatarData?.urls?.original,
  ];
  return candidates.find((item: unknown) => typeof item === 'string' && (item as string).length > 0) ?? null;
};

export type ProfilePayload = {
  first_name: string;
  middle_name: string | null;
  last_name: string;
  second_last_name: string | null;
  rut: string;
  phone_number: string | null;
  address: string | null;
  gender: string | null;
  fecha_nacimiento: string | null;
  date_of_birth: string | null;
};

export const buildProfileUpdatePayload = (values: Record<string, any>, toApiDate: (v?: string) => string | null, toGenderApiValueFn: (v?: string | null) => string | null): ProfilePayload => {
  const trimOrNull = (value?: string | null) => {
    if (value == null) return null;
    const trimmed = value.toString().trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  return {
    first_name: values.first_name?.toString().trim() ?? '',
    middle_name: trimOrNull(values.second_name),
    last_name: values.last_name?.toString().trim() ?? '',
    second_last_name: trimOrNull(values.second_last_name),
    rut: values.rut?.toString().trim() ?? '',
    phone_number: trimOrNull(values.phone_number),
    address: trimOrNull(values.direccion),
    gender: toGenderApiValueFn(values.genero),
    fecha_nacimiento: toApiDate(values.fecha_nacimiento),
    date_of_birth: toApiDate(values.fecha_nacimiento),
  };
};
