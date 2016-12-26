
# About

octo is a Javascript based pattern drafting system. Code specifies the
location in physical units of shapes like lines and curves.  octo divides up
the area that has been drawn on into different physical pages in a PDF file. 
These pages can be printed and reassembled to build a physical pattern. 

octo automatically adds figures on the pages to assist in reassembly, namely
borders around the printed area and labels showing how each page should be
assembled.

octo will eventually generate SVG output but doesn't currently.

octo currently runs in Node.JS and is envisioned to eventually run in the
browser. It uses PDFKit to generate PDF output.

Example output can be found in the examples/ directory. Currently this is
the only documentation :).

# Copyright and License

Copyright (C) 2016 Steve Benson

octo was written by Steve Benson.

octo is free software; you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free
Software Foundation; either version 3, or (at your option) any later
version.

octo is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more
details.

You should have received a copy of the GNU General Public License along with
this program; see the file LICENSE.  If not, see <http://www.gnu.org/licenses/>.
