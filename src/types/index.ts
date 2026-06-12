export interface Mail {
  id: string;
  from_user_id: string;
  from_user_name: string;
  from_user_photo_count: string;
  from_user_movie_count: string;
  subject: string;
  sent_at: string;
  open_read?: string;
  has_attached_photo?: string;
  attached_photo_id?: string;
  is_myself?: string;
  body?: string;
}

export interface UserInfo {
  id: string;
  name: string;
  login_id: string;
  current_point: string;
  used_point: string;
  current_subpoint1: string;
  current_subpoint2: string;
  current_subpoint3: string;
  public_rank: string;
  area2: string;
  area3: string;
  address: string;
  verifield_tel: string;
}

export type MailListMode = 'unread' | 'sent' | 'all';

export type RootStackParamList = {
  Setup: undefined;
  Login: undefined;
  MainTabs: undefined;
  MailDetail: { userId: string; mailId: string };
  MailCompose: { replyToUserId?: string; replyToMailId?: string; replyToName?: string };
};
