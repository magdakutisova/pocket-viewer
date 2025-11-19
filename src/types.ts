export interface Article {
    title: string;
    url: string;
    timeAdded: string;
    tags: string[];
    status: 'unread' | 'read';
}