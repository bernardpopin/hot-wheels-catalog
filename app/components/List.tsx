type ListItem = {
  id: string | number;
  label: string;
};

type ListProps = {
  items: ListItem[];
};

export default function List({ items }: ListProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">No items.</p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {items.map((item) => (
        <li
          key={item.id}
          className="py-3 text-sm text-zinc-800 dark:text-zinc-200"
        >
          {item.label}
        </li>
      ))}
    </ul>
  );
}
