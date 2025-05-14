const StreetViewEmbed = ({ location }: { location: string }) => {
  const src = `https://www.google.com/maps/embed/v1/streetview?key=${process.env.NEXT_PUBLIC_MAPS_KEY}&location=${location}&heading=210&pitch=10&fov=80`;

  return (
    <iframe
      width="100%"
      height="100%"
      style={{ border: 0 }}
      loading="lazy"
      allowFullScreen
      src={src}
    ></iframe>
  );
};

export default StreetViewEmbed;
