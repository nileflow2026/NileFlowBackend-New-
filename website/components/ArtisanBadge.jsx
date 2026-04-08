const ArtisanBadge = ({ artisan, compact = false }) => {
  return (
    <div className="inline-flex items-center space-x-2">
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full blur opacity-30"></div>
        <img
          src={artisan.photo}
          alt={artisan.name}
          className="relative w-8 h-8 rounded-full border-2 border-gray-900 object-cover"
        />
      </div>
      <div>
        <div className="text-xs text-amber-100/70">Handmade by</div>
        <div className="text-sm font-medium text-amber-300">{artisan.name}</div>
      </div>
      {!compact && (
        <div className="flex items-center space-x-1 text-xs">
          <MapPin className="w-3 h-3 text-amber-400" />
          <span className="text-amber-100/70">{artisan.country}</span>
        </div>
      )}
    </div>
  );
};

export default ArtisanBadge;
