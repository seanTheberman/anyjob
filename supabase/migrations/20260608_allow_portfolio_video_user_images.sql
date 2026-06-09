alter table if exists public.user_images
  drop constraint if exists user_images_image_type_check;

alter table if exists public.user_images
  add constraint user_images_image_type_check
  check (image_type in ('profile', 'portfolio', 'portfolio_video', 'work_image', 'id_document', 'selfie_video'));
